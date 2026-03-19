using System.IdentityModel.Tokens.Jwt;
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
                id = context.User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? context.User.FindFirstValue(JwtRegisteredClaimNames.Sub),
                name = context.User.FindFirstValue(ClaimTypes.GivenName)
                       ?? context.User.FindFirstValue(JwtRegisteredClaimNames.GivenName),
                email = context.User.FindFirstValue(ClaimTypes.Email)
                        ?? context.User.FindFirstValue(JwtRegisteredClaimNames.Email),
            };
        }

        Inertia.Share("auth", new { user = authUser });

        await next(context);
    }
}
