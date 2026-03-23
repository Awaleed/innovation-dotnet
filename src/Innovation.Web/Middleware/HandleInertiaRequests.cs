using System.Security.Claims;
using InertiaCore;
using Innovation.Application.Common.Constants;

namespace Innovation.Web.Middleware;

public class HandleInertiaRequests(IConfiguration configuration) : IMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        // Asset version prefix — forces full-page reload on cross-backend navigation (strangler fig)
        Inertia.Version("dotnet-" + Environment.GetEnvironmentVariable("APP_VERSION") ?? "1");

        // Auth
        object? authUser = null;
        string[]? roles = null;
        string[]? permissions = null;

        if (context.User.Identity?.IsAuthenticated == true)
        {
            authUser = new
            {
                id = context.User.FindFirstValue(ClaimTypes.NameIdentifier),
                name = context.User.FindFirstValue(ClaimTypes.GivenName),
                email = context.User.FindFirstValue(ClaimTypes.Email),
            };

            roles = context.User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToArray();
            permissions = context
                .User.FindAll(ClaimConstants.Permission)
                .Select(c => c.Value)
                .ToArray();
        }

        // Localization
        var currentLocale = Thread.CurrentThread.CurrentUICulture.TwoLetterISOLanguageName;
        if (currentLocale != "ar" && currentLocale != "en")
            currentLocale = "ar";

        // Share all props (matches Laravel HandleInertiaRequests)
        Inertia.Share("name", configuration.GetValue("AppName", "Innovation Platform"));
        Inertia.Share(
            "auth",
            new
            {
                user = authUser,
                roles = roles ?? Array.Empty<string>(),
                permissions = permissions ?? Array.Empty<string>(),
            }
        );
        Inertia.Share("sidebarOpen", true);
        Inertia.Share(
            "localization",
            new
            {
                currentLocale,
                currentLocaleDirection = currentLocale == "ar" ? "rtl" : "ltr",
                supportedLocales = new Dictionary<string, object>
                {
                    ["en"] = new { name = "English", native = "English" },
                    ["ar"] = new { name = "Arabic", native = "العربية" },
                },
            }
        );
        Inertia.Share("flash", new { success = (string?)null, error = (string?)null });

        await next(context);
    }
}
