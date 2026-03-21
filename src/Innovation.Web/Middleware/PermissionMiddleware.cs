using System.Security.Claims;
using Innovation.Application.Common.Constants;
using Innovation.Application.Common.Interfaces;

namespace Innovation.Web.Middleware;

/// <summary>
/// Loads roles and permissions from the database per-request and adds them as claims.
/// Runs after UseAuthentication(), before UseAuthorization().
/// Role changes take effect immediately — no re-login needed.
/// </summary>
public class PermissionMiddleware(IPermissionService permissionService) : IMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var localUserIdClaim = context.User.FindFirstValue(ClaimConstants.LocalUserId);
            if (localUserIdClaim is not null && int.TryParse(localUserIdClaim, out var userId))
            {
                var identity = context.User.Identity as ClaimsIdentity;
                if (identity is not null)
                {
                    var roles = await permissionService.GetRolesForUserAsync(userId);
                    foreach (var role in roles)
                        identity.AddClaim(new Claim(ClaimTypes.Role, role));

                    var permissions = await permissionService.GetPermissionsForUserAsync(userId);
                    foreach (var permission in permissions)
                        identity.AddClaim(new Claim(ClaimConstants.Permission, permission));
                }
            }
        }

        await next(context);
    }
}
