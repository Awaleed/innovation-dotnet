using System.Security.Claims;
using Innovation.Application.Common.Constants;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Innovation.Web.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        app.MapGet("user/me", (ClaimsPrincipal claimsPrincipal) =>
        {
            return claimsPrincipal.Claims.ToDictionary(c => c.Type, c => c.Value);
        }).RequireAuthorization();

        app.MapPost("/auth/backchannel-logout", HandleBackchannelLogout)
            .AllowAnonymous();
    }

    /// <summary>
    /// Keycloak backchannel logout — receives logout_token when admin terminates a session.
    /// Validates the JWT per OIDC Back-Channel Logout spec and marks the session as revoked in cache.
    /// </summary>
    private static async Task<IResult> HandleBackchannelLogout(
        HttpContext httpContext,
        IDistributedCache cache,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory,
        ILoggerFactory loggerFactory)
    {
        var logger = loggerFactory.CreateLogger("Innovation.Web.Auth.BackchannelLogout");

        if (!httpContext.Request.HasFormContentType)
            return Results.BadRequest("Expected form content type");

        var form = await httpContext.Request.ReadFormAsync();
        var logoutToken = form["logout_token"].FirstOrDefault();

        if (string.IsNullOrEmpty(logoutToken))
            return Results.BadRequest("Missing logout_token");

        // Validate the JWT signature, issuer, and audience
        var keycloakAuthority = $"{configuration["Keycloak:auth-server-url"]}/realms/{configuration["Keycloak:realm"]}";
        var jwksUrl = $"{keycloakAuthority}/protocol/openid-connect/certs";

        using var httpClient = httpClientFactory.CreateClient();
        var jwksJson = await httpClient.GetStringAsync(jwksUrl);
        var jwks = new JsonWebKeySet(jwksJson);

        var validationParameters = new TokenValidationParameters
        {
            ValidIssuer = keycloakAuthority,
            ValidAudience = configuration["Keycloak:resource"],
            IssuerSigningKeys = jwks.GetSigningKeys(),
            ValidateLifetime = false, // Keycloak logout tokens may omit exp
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            RequireSignedTokens = true,
        };

        var tokenHandler = new JsonWebTokenHandler();

        TokenValidationResult result;
        try
        {
            result = await tokenHandler.ValidateTokenAsync(logoutToken, validationParameters);
            if (!result.IsValid)
                throw result.Exception ?? new SecurityTokenValidationException("Token validation failed");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Backchannel logout token validation failed");
            return Results.BadRequest("Invalid logout_token");
        }

        var jwt = (JsonWebToken)result.SecurityToken;

        // Validate events claim (OIDC Back-Channel Logout spec)
        var eventsClaim = jwt.Claims.FirstOrDefault(c => c.Type == "events")?.Value;
        if (eventsClaim is null || !eventsClaim.Contains("http://schemas.openid.net/event/backchannel-logout"))
            return Results.BadRequest("Missing or invalid events claim");

        // Spec: logout token MUST NOT contain a nonce
        if (jwt.Claims.Any(c => c.Type == "nonce"))
            return Results.BadRequest("Logout token must not contain nonce");

        var sid = jwt.Claims.FirstOrDefault(c => c.Type == ClaimConstants.SessionId)?.Value;
        var sub = jwt.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;

        if (sid is null && sub is null)
            return Results.BadRequest("Token must contain sid or sub");

        // Mark session as revoked in distributed cache
        var ttlHours = configuration.GetValue("SessionRevocation:CacheTtlHours", 24);
        var cacheOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(ttlHours)
        };

        if (sid is not null)
            await cache.SetStringAsync($"revoked-session:{sid}", "revoked", cacheOptions);

        if (sub is not null)
            await cache.SetStringAsync($"revoked-user:{sub}", "revoked", cacheOptions);

        return Results.Ok();
    }
}
