using Microsoft.AspNetCore.Authorization;

namespace Innovation.Web.Authorization;

public class PermissionRequirement(string permission) : IAuthorizationRequirement
{
    public string Permission { get; } = permission;
}
