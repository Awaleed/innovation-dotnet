using System.Security.Claims;
using InertiaCore;
using InertiaCore.Extensions;
using Innovation.Application;
using Innovation.Infrastructure;
using Innovation.Infrastructure.Data;
using Innovation.Infrastructure.Data.Interceptors;
using Innovation.ServiceDefaults;
using Innovation.Web.Endpoints;
using Innovation.Web.Middleware;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.AddRedisDistributedCache("redis");

// Application + Infrastructure layers
builder.Services.AddApplication();
builder.Services.AddInfrastructure();

// EF Core with PostgreSQL via Aspire
builder.Services.AddDbContext<AppDbContext>((sp, options) =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("innovationdb") ?? "Host=localhost;Database=innovation;");
    options.AddInterceptors(
        sp.GetRequiredService<AuditableInterceptor>(),
        sp.GetRequiredService<SoftDeleteInterceptor>());
});

builder.Services.AddProblemDetails();
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});
builder.Services.AddControllersWithViews()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

builder.Services.AddInertia(options =>
{
    options.RootView = "~/Views/App.cshtml";
});

builder.Services.AddViteHelper(options =>
{
    options.PublicDirectory = "wwwroot";
    options.BuildDirectory = "build";
    options.ManifestFilename = "manifest.json";
    options.HotFile = "hot";
});

// Authentication: Cookie (default) + OIDC via Keycloak
var keycloakUrl = builder.Configuration.GetConnectionString("keycloak") ?? "http://localhost:8080";

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/login";
        options.AccessDeniedPath = "/login";
        options.ExpireTimeSpan = TimeSpan.FromHours(1);
        options.SlidingExpiration = true;
        options.ForwardChallenge = "keycloak-oidc";

        options.Events.OnValidatePrincipal = async context =>
        {
            var logger = context.HttpContext.RequestServices
                .GetRequiredService<ILoggerFactory>()
                .CreateLogger("Innovation.Web.Auth.Cookie");

            var sid = context.Principal?.FindFirst("sid")?.Value;
            var sub = context.Principal?.FindFirst("sub")?.Value
                      ?? context.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (sid is null)
            {
                logger.LogDebug("OnValidatePrincipal: No sid claim for sub={Sub} — skipping revocation check", sub);
                return;
            }

            var cache = context.HttpContext.RequestServices
                .GetRequiredService<IDistributedCache>();

            var revoked = await cache.GetStringAsync($"revoked-session:{sid}");

            if (revoked is not null)
            {
                logger.LogInformation("OnValidatePrincipal: Session REVOKED — rejecting principal. sid={Sid}, sub={Sub}", sid, sub);
                context.RejectPrincipal();
                await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            }
            else
            {
                logger.LogDebug("OnValidatePrincipal: Session valid. sid={Sid}, sub={Sub}", sid, sub);
            }
        };
    })
    .AddOpenIdConnect("keycloak-oidc", options =>
    {
        options.Authority = $"{keycloakUrl}/realms/innovation";
        options.ClientId = "innovation-web";
        options.ClientSecret = "innovation-web-secret";
        options.ResponseType = "code";
        options.SaveTokens = true;
        options.GetClaimsFromUserInfoEndpoint = true;
        options.Scope.Add("openid");
        options.Scope.Add("profile");
        options.Scope.Add("email");
        options.RequireHttpsMetadata = false;
        options.ClaimActions.MapUniqueJsonKey("sid", "sid");
        options.TokenValidationParameters = new TokenValidationParameters
        {
            RoleClaimType = "roles",
            NameClaimType = "preferred_username",
        };

        // Backchannel logout — Keycloak notifies app when admin kills a session
        options.SignedOutCallbackPath = "/signout-callback-oidc";
        options.RemoteSignOutPath = "/signout-oidc";

        // Map Keycloak claims to standard ClaimTypes used by HandleInertiaRequests
        options.Events.OnTokenValidated = context =>
        {
            var logger = context.HttpContext.RequestServices
                .GetRequiredService<ILoggerFactory>()
                .CreateLogger("Innovation.Web.Auth.OIDC");

            var identity = context.Principal?.Identity as ClaimsIdentity;
            if (identity is null)
            {
                logger.LogWarning("OnTokenValidated: Principal identity is null");
                return Task.CompletedTask;
            }

            var preferredUsername = identity.FindFirst("preferred_username")?.Value;
            var sub = identity.FindFirst("sub")?.Value;
            var sid = identity.FindFirst("sid")?.Value;

            logger.LogDebug("OnTokenValidated: sub={Sub}, sid={Sid}, preferred_username={Username}",
                sub, sid, preferredUsername);

            var name = identity.FindFirst("name")?.Value
                       ?? identity.FindFirst("given_name")?.Value
                       ?? preferredUsername;
            if (name is not null && identity.FindFirst(ClaimTypes.GivenName) is null)
                identity.AddClaim(new Claim(ClaimTypes.GivenName, name));

            if (sub is not null && identity.FindFirst(ClaimTypes.NameIdentifier) is null)
                identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, sub));

            var email = identity.FindFirst("email")?.Value;
            if (email is not null && identity.FindFirst(ClaimTypes.Email) is null)
                identity.AddClaim(new Claim(ClaimTypes.Email, email));

            if (sid is not null)
            {
                logger.LogDebug("OnTokenValidated: Persisted sid claim: {Sid}", sid);
            }
            else
            {
                logger.LogWarning("OnTokenValidated: No sid claim in token — backchannel logout will not work for this session");
            }

            return Task.CompletedTask;
        };

        options.Events.OnRemoteSignOut = async context =>
        {
            await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            context.HandleResponse();
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddTransient<HandleInertiaRequests>();

var app = builder.Build();

// Auto-apply EF Core migrations on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}

app.MapDefaultEndpoints();

app.UseStaticFiles();
app.UseInertia();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<HandleInertiaRequests>();

app.MapControllers();
app.MapChallengeEndpoints();


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

}

app.MapGet("user/me", (ClaimsPrincipal claimsPrincipal) =>
{
    return claimsPrincipal.Claims.ToDictionary(c => c.Type, c => c.Value);
}).RequireAuthorization();

// Keycloak backchannel logout — receives logout_token when admin terminates a session
app.MapPost("/auth/backchannel-logout", async (
    HttpContext httpContext,
    IDistributedCache cache,
    IConfiguration configuration,
    ILoggerFactory loggerFactory) =>
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
    var keycloakAuthority = $"{configuration.GetConnectionString("keycloak") ?? "http://localhost:8080"}/realms/innovation";
    var jwksUrl = $"{keycloakAuthority}/protocol/openid-connect/certs";

    logger.LogDebug("Fetching JWKS from {JwksUrl}", jwksUrl);

    using var httpClient = new HttpClient();
    var jwksJson = await httpClient.GetStringAsync(jwksUrl);
    var jwks = new JsonWebKeySet(jwksJson);

    var validationParameters = new TokenValidationParameters
    {
        ValidIssuer = keycloakAuthority,
        ValidAudience = "innovation-web",
        IssuerSigningKeys = jwks.GetSigningKeys(),
        ValidateLifetime = false, // Keycloak logout tokens may omit exp
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateIssuerSigningKey = true,
        RequireSignedTokens = true,
    };

    var tokenHandler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();

    System.IdentityModel.Tokens.Jwt.JwtSecurityToken jwt;
    try
    {
        tokenHandler.ValidateToken(logoutToken, validationParameters, out var validatedToken);
        jwt = (System.IdentityModel.Tokens.Jwt.JwtSecurityToken)validatedToken;
        logger.LogDebug("Logout token signature and claims validated successfully");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Rejected: logout token validation failed");
        return Results.BadRequest("Invalid logout_token");
    }

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
    var sid = jwt.Claims.FirstOrDefault(c => c.Type == "sid")?.Value;
    var sub = jwt.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;

    logger.LogInformation("Backchannel logout token validated: sub={Sub}, sid={Sid}", sub, sid);

    if (sid is null && sub is null)
    {
        logger.LogWarning("Rejected: token has neither sid nor sub");
        return Results.BadRequest("Token must contain sid or sub");
    }

    // 6. Mark session as revoked in distributed cache
    var cacheOptions = new DistributedCacheEntryOptions
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24)
    };

    if (sid is not null)
    {
        var cacheKey = $"revoked-session:{sid}";
        await cache.SetStringAsync(cacheKey, "revoked", cacheOptions);
        logger.LogInformation("Cached session revocation: key={CacheKey}, ttl=24h", cacheKey);
    }

    if (sub is not null)
    {
        var cacheKey = $"revoked-user:{sub}";
        await cache.SetStringAsync(cacheKey, "revoked", cacheOptions);
        logger.LogDebug("Cached user-level revocation: key={CacheKey}", cacheKey);
    }

    logger.LogInformation("Backchannel logout processed successfully for sub={Sub}, sid={Sid}", sub, sid);
    return Results.Ok();
}).AllowAnonymous();

app.Run();
