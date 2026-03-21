namespace Innovation.Application.Common.Interfaces;

public interface IPermissionService
{
    Task<IReadOnlyList<string>> GetPermissionsForUserAsync(
        int userId,
        CancellationToken ct = default
    );

    Task<IReadOnlyList<string>> GetRolesForUserAsync(int userId, CancellationToken ct = default);

    Task AssignRoleAsync(int userId, string roleName, CancellationToken ct = default);

    Task SyncRolesAsync(int userId, IEnumerable<string> roleNames, CancellationToken ct = default);

    Task GivePermissionAsync(int userId, string permissionName, CancellationToken ct = default);

    Task RevokePermissionAsync(int userId, string permissionName, CancellationToken ct = default);
}
