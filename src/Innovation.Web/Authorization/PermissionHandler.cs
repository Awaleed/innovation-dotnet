using Innovation.Application.Common.Constants;
using Microsoft.AspNetCore.Authorization;

namespace Innovation.Web.Authorization;

public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement
    )
    {
        var hasPermission = context
            .User.FindAll(ClaimConstants.Permission)
            .Any(c =>
                string.Equals(c.Value, requirement.Permission, StringComparison.OrdinalIgnoreCase)
            );

        if (hasPermission)
            context.Succeed(requirement);

        return Task.CompletedTask;
    }
}
