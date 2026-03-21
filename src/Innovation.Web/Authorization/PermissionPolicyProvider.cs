using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace Innovation.Web.Authorization;

/// <summary>
/// Dynamic policy provider that creates authorization policies on-the-fly
/// for Permission: and UserType: prefixed policy names.
/// This avoids pre-registering every permission as a named policy.
/// </summary>
public class PermissionPolicyProvider(IOptions<AuthorizationOptions> options)
    : DefaultAuthorizationPolicyProvider(options)
{
    private const string PermissionPrefix = "Permission:";
    private const string UserTypePrefix = "UserType:";

    public override async Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        // Check if it's a pre-registered policy first
        var policy = await base.GetPolicyAsync(policyName);
        if (policy is not null)
            return policy;

        if (policyName.StartsWith(PermissionPrefix, StringComparison.Ordinal))
        {
            var permission = policyName[PermissionPrefix.Length..];
            return new AuthorizationPolicyBuilder()
                .AddRequirements(new PermissionRequirement(permission))
                .Build();
        }

        if (policyName.StartsWith(UserTypePrefix, StringComparison.Ordinal))
        {
            var parts = policyName[UserTypePrefix.Length..].Split(',');
            return new AuthorizationPolicyBuilder()
                .AddRequirements(new UserTypeRequirement(parts))
                .Build();
        }

        return null;
    }
}
