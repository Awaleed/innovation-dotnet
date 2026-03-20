using InertiaCore;
using InertiaCore.Extensions;
using Innovation.ServiceDefaults;
using Innovation.Web.Middleware;
using Innovation.Web.Services;
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
