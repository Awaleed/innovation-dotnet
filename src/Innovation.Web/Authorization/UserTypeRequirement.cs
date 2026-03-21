using Microsoft.AspNetCore.Authorization;

namespace Innovation.Web.Authorization;

public class UserTypeRequirement(string[] userTypes, bool requireAll = false)
    : IAuthorizationRequirement
{
    public string[] UserTypes { get; } = userTypes;
    public bool RequireAll { get; } = requireAll;
}
