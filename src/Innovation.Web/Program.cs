using InertiaCore;
using InertiaCore.Extensions;
using Innovation.ServiceDefaults;
using Innovation.Web.Middleware;
using Microsoft.AspNetCore.Authentication.Cookies;

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

// Cookie authentication — .NET 10 auto-handles redirect vs 401 for API endpoints
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/login";
        options.LogoutPath = "/api/auth/logout";
        options.AccessDeniedPath = "/login";
        options.ExpireTimeSpan = TimeSpan.FromHours(1);
        options.SlidingExpiration = true;
    });

builder.Services.AddAuthorization();
builder.Services.AddTransient<HandleInertiaRequests>();

// HttpClient for proxying API calls to Identity.API
builder.Services.AddHttpClient("identity-api", client =>
{
    client.BaseAddress = new Uri("https+http://identity-api");
});

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
