using System.Security.Claims;
using InertiaCore;

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

        await next(context);
    }
}
