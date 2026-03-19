using System.Diagnostics;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using InertiaCore;
using InertiaCore.Extensions;
using Innovation.ServiceDefaults;
using Microsoft.AspNetCore.Authentication.JwtBearer;
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

// JWT auth so we can validate tokens from Identity.API
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secret = jwtSettings["Secret"];
if (!string.IsNullOrEmpty(secret))
{
    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSettings["Issuer"],
                ValidAudience = jwtSettings["Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
            };

            // Also accept token from cookie (not just Authorization header)
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    if (context.Request.Cookies.TryGetValue("auth_token", out var token))
                    {
                        context.Token = token;
                    }
                    return Task.CompletedTask;
                },
                // Redirect to /login for browser/Inertia requests instead of returning 401
                OnChallenge = context =>
                {
                    var isApiRequest = context.Request.Path.StartsWithSegments("/api");
                    if (!isApiRequest)
                    {
                        context.HandleResponse();
                        context.Response.Redirect("/login");
                    }
                    return Task.CompletedTask;
                }
            };
        });
}

builder.Services.AddAuthorization();

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

// Share auth data with every Inertia page
app.Use(async (context, next) =>
{
    object? authUser = null;

    if (context.User.Identity?.IsAuthenticated == true)
    {
        authUser = new
        {
            id = context.User.FindFirstValue(ClaimTypes.NameIdentifier)
                 ?? context.User.FindFirstValue(JwtRegisteredClaimNames.Sub),
            name = context.User.FindFirstValue(ClaimTypes.GivenName)
                   ?? context.User.FindFirstValue(JwtRegisteredClaimNames.GivenName),
            email = context.User.FindFirstValue(ClaimTypes.Email)
                    ?? context.User.FindFirstValue(JwtRegisteredClaimNames.Email),
        };
    }

    Inertia.Share("auth", new { user = authUser });

    await next();
});

app.MapControllers();

app.Run();
