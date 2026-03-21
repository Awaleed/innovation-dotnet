using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace Innovation.Web.Authorization;

public class UserTypeHandler : AuthorizationHandler<UserTypeRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        UserTypeRequirement requirement
    )
    {
        var userRoles = context
            .User.FindAll(ClaimTypes.Role)
            .Select(c => c.Value)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        // super-admin always passes
        if (userRoles.Contains("super-admin"))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        bool authorized = requirement.RequireAll
            ? requirement.UserTypes.All(ut => userRoles.Contains(ut))
            : requirement.UserTypes.Any(ut => userRoles.Contains(ut));

        if (authorized)
            context.Succeed(requirement);

        return Task.CompletedTask;
    }
}
