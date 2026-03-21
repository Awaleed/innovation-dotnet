namespace Innovation.Application.Common.Interfaces;

public interface ICurrentUserService
{
    int? LocalUserId { get; }
    string? UserId { get; }
    string? UserName { get; }
    string? Email { get; }
    bool IsAuthenticated { get; }
    IReadOnlyList<string> Roles { get; }
    IReadOnlyList<string> Permissions { get; }
    bool HasPermission(string permission);
    bool HasAnyPermission(params string[] permissions);
    bool IsAdmin();
    bool IsSuperAdmin();
    bool IsEvaluator();
    bool IsJury();
    bool IsMentor();
}
