using System.Security.Claims;
using System.Text.Json;
using InertiaCore;
using Microsoft.AspNetCore.Mvc.ViewFeatures;

namespace Innovation.Web.Middleware;

public class HandleInertiaRequests : IMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        object? authUser = null;

        if (context.User.Identity?.IsAuthenticated == true)
        {
            authUser = new
            {
                id = context.User.FindFirstValue(ClaimTypes.NameIdentifier),
                name = context.User.FindFirstValue(ClaimTypes.GivenName),
                email = context.User.FindFirstValue(ClaimTypes.Email),
            };
        }

        Inertia.Share("auth", new { user = authUser });

        // Read flashed validation errors from TempData (set by POST handlers on redirect)
        var tempDataFactory = context.RequestServices.GetService<ITempDataDictionaryFactory>();
        if (tempDataFactory != null)
        {
            var tempData = tempDataFactory.GetTempData(context);
            if (tempData.TryGetValue("errors", out var errorsJson) && errorsJson is string json)
            {
                var errors = JsonSerializer.Deserialize<Dictionary<string, string>>(json);
                if (errors != null && errors.Count > 0)
                {
                    Inertia.Share("errors", errors);
                }
            }
        }

        await next(context);
    }
}
