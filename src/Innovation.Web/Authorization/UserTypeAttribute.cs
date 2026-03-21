using Microsoft.AspNetCore.Authorization;

namespace Innovation.Web.Authorization;

/// <summary>
/// Convenience attribute for role-based authorization (like Laravel's UserTypeMiddleware).
/// Usage: [UserType("admin", "super-admin")]
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public class UserTypeAttribute : AuthorizeAttribute
{
    public UserTypeAttribute(params string[] userTypes)
        : base($"UserType:{string.Join(",", userTypes)}") { }
}
