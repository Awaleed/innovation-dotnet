using System.Diagnostics;
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

if (app.Environment.IsDevelopment())
{
    // Auto-start Vite dev server
    var clientAppDir = Path.Combine(app.Environment.ContentRootPath, "ClientApp");
    var hotFile = Path.Combine(app.Environment.ContentRootPath, "wwwroot", "hot");

    if (!File.Exists(hotFile))
    {
        var viteProcess = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = "/c npm run dev",
                WorkingDirectory = clientAppDir,
                UseShellExecute = false,
                RedirectStandardOutput = false,
                RedirectStandardError = false,
                CreateNoWindow = true,
            }
        };
        viteProcess.Start();

        var timeout = DateTime.UtcNow.AddSeconds(30);
        while (!File.Exists(hotFile) && DateTime.UtcNow < timeout)
        {
            await Task.Delay(500);
        }

        if (File.Exists(hotFile))
        {
            Console.WriteLine($"Vite dev server started at {File.ReadAllText(hotFile).Trim()}");
        }
        else
        {
            Console.WriteLine("Warning: Vite dev server did not start in time.");
        }

        app.Lifetime.ApplicationStopping.Register(() =>
        {
            try
            {
                if (!viteProcess.HasExited) viteProcess.Kill(entireProcessTree: true);
                if (File.Exists(hotFile)) File.Delete(hotFile);
            }
            catch { }
        });
    }
}

app.UseStaticFiles();
app.UseInertia();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<HandleInertiaRequests>();

app.MapControllers();

app.Run();
