using Innovation.Application.Common.Interfaces;
using Innovation.Domain.Entities.Authorization;
using Innovation.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.DependencyInjection;

namespace Innovation.Infrastructure.Services;

public class PermissionService(
    AppDbContext db,
    HybridCache cache,
    IServiceScopeFactory scopeFactory
) : IPermissionService
{
    private const string CacheKey = "permissions:all";
    private static readonly string[] CacheTags = ["permissions"];

    private static readonly HybridCacheEntryOptions CacheOptions = new()
    {
        Expiration = TimeSpan.FromHours(24),
        LocalCacheExpiration = TimeSpan.FromMinutes(5),
    };

    public async Task<IReadOnlyList<string>> GetPermissionsForUserAsync(
        int userId,
        CancellationToken ct = default
    )
    {
        var cached = await GetCachedDataAsync(ct);

        var userRoleIds = await db
            .UserRoles.Where(ur => ur.UserId == userId)
            .Select(ur => ur.RoleId)
            .ToListAsync(ct);

        var permissionIds = new HashSet<int>();
        foreach (var roleId in userRoleIds)
        {
            if (cached.RolePermissions.TryGetValue(roleId, out var rolePermIds))
            {
                foreach (var pid in rolePermIds)
                    permissionIds.Add(pid);
            }
        }

        var directPermIds = await db
            .UserPermissions.Where(up => up.UserId == userId)
            .Select(up => up.PermissionId)
            .ToListAsync(ct);

        foreach (var pid in directPermIds)
            permissionIds.Add(pid);

        return permissionIds
            .Where(id => cached.Permissions.ContainsKey(id))
            .Select(id => cached.Permissions[id])
            .OrderBy(p => p)
            .ToList();
    }

    public async Task<IReadOnlyList<string>> GetRolesForUserAsync(
        int userId,
        CancellationToken ct = default
    )
    {
        var cached = await GetCachedDataAsync(ct);

        var userRoleIds = await db
            .UserRoles.Where(ur => ur.UserId == userId)
            .Select(ur => ur.RoleId)
            .ToListAsync(ct);

        return userRoleIds
            .Where(id => cached.Roles.ContainsKey(id))
            .Select(id => cached.Roles[id])
            .OrderBy(r => r)
            .ToList();
    }

    public async Task AssignRoleAsync(int userId, string roleName, CancellationToken ct = default)
    {
        var role =
            await db.Roles.FirstOrDefaultAsync(r => r.Name == roleName, ct)
            ?? throw new InvalidOperationException($"Role '{roleName}' not found.");

        var exists = await db.UserRoles.AnyAsync(
            ur => ur.UserId == userId && ur.RoleId == role.Id,
            ct
        );

        if (!exists)
        {
            db.UserRoles.Add(new UserRole { UserId = userId, RoleId = role.Id });
            await db.SaveChangesAsync(ct);
        }

        await InvalidateCacheAsync(ct);
    }

    public async Task SyncRolesAsync(
        int userId,
        IEnumerable<string> roleNames,
        CancellationToken ct = default
    )
    {
        var roleNameList = roleNames.ToList();
        var roles = await db.Roles.Where(r => roleNameList.Contains(r.Name)).ToListAsync(ct);

        var existingUserRoles = await db.UserRoles.Where(ur => ur.UserId == userId).ToListAsync(ct);

        db.UserRoles.RemoveRange(existingUserRoles);

        foreach (var role in roles)
        {
            db.UserRoles.Add(new UserRole { UserId = userId, RoleId = role.Id });
        }

        await db.SaveChangesAsync(ct);
        await InvalidateCacheAsync(ct);
    }

    public async Task GivePermissionAsync(
        int userId,
        string permissionName,
        CancellationToken ct = default
    )
    {
        var permission =
            await db.Permissions.FirstOrDefaultAsync(p => p.Name == permissionName, ct)
            ?? throw new InvalidOperationException($"Permission '{permissionName}' not found.");

        var exists = await db.UserPermissions.AnyAsync(
            up => up.UserId == userId && up.PermissionId == permission.Id,
            ct
        );

        if (!exists)
        {
            db.UserPermissions.Add(
                new UserPermission { UserId = userId, PermissionId = permission.Id }
            );
            await db.SaveChangesAsync(ct);
        }

        await InvalidateCacheAsync(ct);
    }

    public async Task RevokePermissionAsync(
        int userId,
        string permissionName,
        CancellationToken ct = default
    )
    {
        var permission = await db.Permissions.FirstOrDefaultAsync(
            p => p.Name == permissionName,
            ct
        );

        if (permission is null)
            return;

        var userPermission = await db.UserPermissions.FirstOrDefaultAsync(
            up => up.UserId == userId && up.PermissionId == permission.Id,
            ct
        );

        if (userPermission is not null)
        {
            db.UserPermissions.Remove(userPermission);
            await db.SaveChangesAsync(ct);
        }

        await InvalidateCacheAsync(ct);
    }

    private async Task<CachedPermissionData> GetCachedDataAsync(CancellationToken ct)
    {
        return await cache.GetOrCreateAsync(
            CacheKey,
            async innerCt => await LoadFromDatabaseAsync(innerCt),
            CacheOptions,
            CacheTags,
            ct
        );
    }

    private async Task InvalidateCacheAsync(CancellationToken ct)
    {
        await cache.RemoveByTagAsync("permissions", ct);
    }

    private async Task<CachedPermissionData> LoadFromDatabaseAsync(CancellationToken ct)
    {
        // Use a separate scope to avoid DbContext concurrency issues
        using var scope = scopeFactory.CreateScope();
        var scopedDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var roles = await scopedDb
            .Roles.IgnoreQueryFilters()
            .Where(r => r.DeletedAt == null)
            .Select(r => new { r.Id, r.Name })
            .ToDictionaryAsync(r => r.Id, r => r.Name, ct);

        var permissions = await scopedDb
            .Permissions.IgnoreQueryFilters()
            .Where(p => p.DeletedAt == null)
            .Select(p => new { p.Id, p.Name })
            .ToDictionaryAsync(p => p.Id, p => p.Name, ct);

        var rolePermissions = await scopedDb
            .RolePermissions.GroupBy(rp => rp.RoleId)
            .ToDictionaryAsync(g => g.Key, g => g.Select(rp => rp.PermissionId).ToArray(), ct);

        return new CachedPermissionData
        {
            Roles = roles,
            Permissions = permissions,
            RolePermissions = rolePermissions,
        };
    }
}

public record CachedPermissionData
{
    public Dictionary<int, string> Roles { get; init; } = [];
    public Dictionary<int, string> Permissions { get; init; } = [];
    public Dictionary<int, int[]> RolePermissions { get; init; } = [];
}
