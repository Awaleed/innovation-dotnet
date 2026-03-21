using System.Security.Claims;
using Innovation.Application.Common.Constants;
using Innovation.Domain.Entities;
using Innovation.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Keycloak.AuthServices.Authentication;
using Keycloak.AuthServices.Authorization;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;

namespace Innovation.Web.Extensions;

internal static class AuthenticationExtensions
{
    /// <summary>
    /// Registers Keycloak OIDC + Cookie authentication, authorization,
    /// backchannel session revocation, and local user sync on login.
    /// </summary>
    internal static WebApplicationBuilder AddKeycloakAuth(this WebApplicationBuilder builder)
    {
        ConfigureKeycloakServices(builder);
        ConfigureCookieOptions(builder);
        ConfigureOidcOptions(builder);
        PostConfigureOidcEvents(builder);

        return builder;
    }

    private static void ConfigureKeycloakServices(WebApplicationBuilder builder)
    {
        // Bridge Aspire's ConnectionStrings:keycloak → Keycloak:auth-server-url (rest comes from appsettings.json)
        var keycloakUrl = builder.Configuration.GetConnectionString("keycloak") ?? "http://localhost:8080";
        builder.Configuration["Keycloak:auth-server-url"] = keycloakUrl;

        builder.Services.AddKeycloakWebAppAuthentication(builder.Configuration);
        builder.Services.AddAuthorization()
            .AddKeycloakAuthorization(builder.Configuration);
    }

    private static void ConfigureCookieOptions(WebApplicationBuilder builder)
    {
        builder.Services.Configure<CookieAuthenticationOptions>(
            CookieAuthenticationDefaults.AuthenticationScheme, options =>
        {
            options.LoginPath = "/login";
            options.AccessDeniedPath = "/login";
            options.ExpireTimeSpan = TimeSpan.FromHours(builder.Configuration.GetValue("CookieAuth:ExpireHours", 1));
            options.SlidingExpiration = true;

            options.Events.OnValidatePrincipal = async context =>
            {
                var sid = context.Principal?.FindFirst(ClaimConstants.SessionId)?.Value;
                if (sid is null)
                    return;

                var cache = context.HttpContext.RequestServices
                    .GetRequiredService<IDistributedCache>();

                var revoked = await cache.GetStringAsync($"revoked-session:{sid}");

                if (revoked is not null)
                {
                    context.RejectPrincipal();
                    await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                }
            };
        });
    }

    private static void ConfigureOidcOptions(WebApplicationBuilder builder)
    {
        builder.Services.Configure<OpenIdConnectOptions>(
            OpenIdConnectDefaults.AuthenticationScheme, options =>
        {
            options.ClaimActions.MapUniqueJsonKey(ClaimConstants.SessionId, ClaimConstants.SessionId);
            options.SaveTokens = true;
            options.GetClaimsFromUserInfoEndpoint = true;
            options.SignedOutCallbackPath = "/signout-callback-oidc";
            options.RemoteSignOutPath = "/signout-oidc";
            options.ResponseType = OpenIdConnectResponseType.Code;

            // Fix "Correlation failed" in development (HTTP without HTTPS)
            options.CorrelationCookie.SameSite = SameSiteMode.Lax;
            options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
            options.NonceCookie.SameSite = SameSiteMode.Lax;
            options.NonceCookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        });
    }

    private static void PostConfigureOidcEvents(WebApplicationBuilder builder)
    {
        // PostConfigure chains our event handlers AFTER the package's role mapping setup
        builder.Services.PostConfigure<OpenIdConnectOptions>(
            OpenIdConnectDefaults.AuthenticationScheme, options =>
        {
            var previousOnTokenValidated = options.Events.OnTokenValidated;

            options.Events.OnTokenValidated = async context =>
            {
                // Run the package's role claims transformation first
                if (previousOnTokenValidated is not null)
                    await previousOnTokenValidated(context);

                var identity = context.Principal?.Identity as ClaimsIdentity;
                if (identity is null)
                    return;

                var preferredUsername = identity.FindFirst("preferred_username")?.Value;
                var sub = identity.FindFirst("sub")?.Value;

                // Map claims to standard ClaimTypes used by HandleInertiaRequests
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

                // Sync local user from Keycloak claims (upsert on login)
                if (sub is not null)
                {
                    var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
                    var user = await db.Users.FirstOrDefaultAsync(u => u.KeycloakId == sub);

                    if (user is null)
                    {
                        user = new User { KeycloakId = sub, Email = email ?? "", Name = name ?? "" };
                        db.Users.Add(user);
                    }
                    else
                    {
                        user.Email = email ?? user.Email;
                        user.Name = name ?? user.Name;
                    }

                    await db.SaveChangesAsync();
                    identity.AddClaim(new Claim(ClaimConstants.LocalUserId, user.Id.ToString()));
                }
            };

            var previousOnRemoteSignOut = options.Events.OnRemoteSignOut;

            options.Events.OnRemoteSignOut = async context =>
            {
                if (previousOnRemoteSignOut is not null)
                    await previousOnRemoteSignOut(context);

                await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                context.HandleResponse();
            };
        });
    }
}
