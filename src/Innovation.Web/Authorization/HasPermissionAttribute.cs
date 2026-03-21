using Microsoft.AspNetCore.Authorization;

namespace Innovation.Web.Authorization;

/// <summary>
/// Convenience attribute for permission-based authorization.
/// Usage: [HasPermission("admin:users:create")]
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public class HasPermissionAttribute : AuthorizeAttribute
{
    public HasPermissionAttribute(string permission)
        : base($"Permission:{permission}") { }
}
