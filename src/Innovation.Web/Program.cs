using System.Security.Claims;
using InertiaCore;
using InertiaCore.Extensions;
using Innovation.ServiceDefaults;
using Innovation.Web.Middleware;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

builder.Services.AddControllersWithViews();

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
            var identity = context.Principal?.Identity as ClaimsIdentity;
            if (identity is null) return Task.CompletedTask;

            var name = identity.FindFirst("name")?.Value
                       ?? identity.FindFirst("given_name")?.Value
                       ?? identity.FindFirst("preferred_username")?.Value;
            if (name is not null && identity.FindFirst(ClaimTypes.GivenName) is null)
                identity.AddClaim(new Claim(ClaimTypes.GivenName, name));

            var sub = identity.FindFirst("sub")?.Value;
            if (sub is not null && identity.FindFirst(ClaimTypes.NameIdentifier) is null)
                identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, sub));

            var email = identity.FindFirst("email")?.Value;
            if (email is not null && identity.FindFirst(ClaimTypes.Email) is null)
                identity.AddClaim(new Claim(ClaimTypes.Email, email));

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

app.MapDefaultEndpoints();

// Vite dev server is managed by Aspire AppHost (AddViteApp)
// No custom process spawning needed here

app.UseStaticFiles();
app.UseInertia();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<HandleInertiaRequests>();

app.MapControllers();

app.Run();
