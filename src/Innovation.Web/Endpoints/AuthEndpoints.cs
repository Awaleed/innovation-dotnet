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
        ILoggerFactory loggerFactory)
    {
        var logger = loggerFactory.CreateLogger("Innovation.Web.Auth.BackchannelLogout");
        logger.LogInformation("Backchannel logout request received from {RemoteIp}", httpContext.Connection.RemoteIpAddress);

        // 1. Read logout_token from form body
        if (!httpContext.Request.HasFormContentType)
        {
            logger.LogWarning("Rejected: request is not form content type");
            return Results.BadRequest("Expected form content type");
        }

        var form = await httpContext.Request.ReadFormAsync();
        var logoutToken = form["logout_token"].FirstOrDefault();

        if (string.IsNullOrEmpty(logoutToken))
        {
            logger.LogWarning("Rejected: no logout_token in form body");
            return Results.BadRequest("Missing logout_token");
        }

        logger.LogDebug("Received logout_token (length={Length})", logoutToken.Length);

        // 2. Validate the JWT signature, issuer, and audience
        var keycloakAuthority = $"{configuration["Keycloak:auth-server-url"]}/realms/{configuration["Keycloak:realm"]}";
        var jwksUrl = $"{keycloakAuthority}/protocol/openid-connect/certs";

        logger.LogDebug("Fetching JWKS from {JwksUrl}", jwksUrl);

        using var httpClient = new HttpClient();
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
            logger.LogDebug("Logout token signature and claims validated successfully");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Rejected: logout token validation failed");
            return Results.BadRequest("Invalid logout_token");
        }

        var jwt = (JsonWebToken)result.SecurityToken;

        // 3. Validate events claim (OIDC Back-Channel Logout spec)
        var eventsClaim = jwt.Claims.FirstOrDefault(c => c.Type == "events")?.Value;
        if (eventsClaim is null || !eventsClaim.Contains("http://schemas.openid.net/event/backchannel-logout"))
        {
            logger.LogWarning("Rejected: missing or invalid 'events' claim. Value={Events}", eventsClaim);
            return Results.BadRequest("Missing or invalid events claim");
        }

        // 4. Spec: logout token MUST NOT contain a nonce
        if (jwt.Claims.Any(c => c.Type == "nonce"))
        {
            logger.LogWarning("Rejected: logout token contains forbidden nonce claim");
            return Results.BadRequest("Logout token must not contain nonce");
        }

        // 5. Extract sid and sub
        var sid = jwt.Claims.FirstOrDefault(c => c.Type == ClaimConstants.SessionId)?.Value;
        var sub = jwt.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;

        logger.LogInformation("Backchannel logout token validated: sub={Sub}, sid={Sid}", sub, sid);

        if (sid is null && sub is null)
        {
            logger.LogWarning("Rejected: token has neither sid nor sub");
            return Results.BadRequest("Token must contain sid or sub");
        }

        // 6. Mark session as revoked in distributed cache
        var ttlHours = configuration.GetValue("SessionRevocation:CacheTtlHours", 24);
        var cacheOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(ttlHours)
        };

        if (sid is not null)
        {
            var cacheKey = $"revoked-session:{sid}";
            await cache.SetStringAsync(cacheKey, "revoked", cacheOptions);
            logger.LogInformation("Cached session revocation: key={CacheKey}, ttl={TtlHours}h", cacheKey, ttlHours);
        }

        if (sub is not null)
        {
            var cacheKey = $"revoked-user:{sub}";
            await cache.SetStringAsync(cacheKey, "revoked", cacheOptions);
            logger.LogDebug("Cached user-level revocation: key={CacheKey}", cacheKey);
        }

        logger.LogInformation("Backchannel logout processed successfully for sub={Sub}, sid={Sid}", sub, sid);
        return Results.Ok();
    }
}
