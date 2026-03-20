using InertiaCore;
using InertiaCore.Extensions;
using Innovation.ServiceDefaults;
using Innovation.Web.Middleware;
using Innovation.Web.Services;
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

// Authentication: Cookie (default) + OIDC (opt-in for SSO/LDAP)
var keycloakUrl = builder.Configuration.GetConnectionString("keycloak") ?? "http://localhost:8080";

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/login";
        options.AccessDeniedPath = "/login";
        options.ExpireTimeSpan = TimeSpan.FromHours(1);
        options.SlidingExpiration = true;

        // Periodically validate Direct Access Grant sessions against Keycloak
        options.Events.OnValidatePrincipal = async context =>
        {
            // Only check sessions that have a refresh token (Direct Access Grant)
            if (!context.Properties.Items.TryGetValue("refresh_token", out var refreshToken)
                || string.IsNullOrEmpty(refreshToken))
                return;

            // Throttle: check at most every 5 minutes
            var lastCheck = context.Properties.GetString("last_keycloak_check");
            if (lastCheck is not null
                && DateTime.TryParse(lastCheck, out var lastCheckTime)
                && lastCheckTime > DateTime.UtcNow.AddSeconds(-30))
                return;

            var keycloakService = context.HttpContext.RequestServices
                .GetRequiredService<KeycloakAuthService>();

            if (!await keycloakService.ValidateRefreshTokenAsync(refreshToken))
            {
                context.RejectPrincipal();
                await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                return;
            }

            context.Properties.SetString("last_keycloak_check", DateTime.UtcNow.ToString("O"));
            context.ShouldRenew = true;
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
        options.TokenValidationParameters = new TokenValidationParameters
        {
            RoleClaimType = "roles",
            NameClaimType = "preferred_username",
        };

        // Backchannel logout — Keycloak notifies app when admin kills a session
        options.SignedOutCallbackPath = "/signout-callback-oidc";
        options.RemoteSignOutPath = "/signout-oidc";

        // Handle backchannel logout even without 'sid' (Direct Access Grant sessions)
        options.Events.OnRemoteSignOut = async context =>
        {
            await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            context.HandleResponse();
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddTransient<HandleInertiaRequests>();

// Keycloak HttpClient (connection string injected by Aspire via WithReference)
builder.Services.AddHttpClient("keycloak", (sp, client) =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    var url = config.GetConnectionString("keycloak") ?? "http://localhost:8080";
    client.BaseAddress = new Uri(url);
});

builder.Services.AddScoped<KeycloakAuthService>();

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
