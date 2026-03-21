using Innovation.Domain.Entities.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Innovation.Infrastructure.Data.Seeders;

public static class PermissionSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AppDbContext>>();

        logger.LogInformation("Seeding roles and permissions...");

        // 1. Generate and upsert all permissions
        var allPermissionNames = PermissionSeederConfig.GenerateAllPermissions();
        var existingPermissions = await db
            .Permissions.IgnoreQueryFilters()
            .Where(p => p.DeletedAt == null)
            .ToDictionaryAsync(p => p.Name, p => p);

        foreach (var name in allPermissionNames)
        {
            if (!existingPermissions.ContainsKey(name))
            {
                var permission = new Permission { Name = name };
                db.Permissions.Add(permission);
                existingPermissions[name] = permission;
            }
        }

        await db.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} permissions", allPermissionNames.Count);

        // 2. Upsert roles from DefaultRoles
        var existingRoles = await db
            .Roles.IgnoreQueryFilters()
            .Where(r => r.DeletedAt == null)
            .ToDictionaryAsync(r => r.Name, r => r);

        foreach (var roleName in PermissionSeederConfig.DefaultRoles.Keys)
        {
            if (!existingRoles.ContainsKey(roleName))
            {
                var role = new Role { Name = roleName };
                db.Roles.Add(role);
                existingRoles[roleName] = role;
            }
        }

        await db.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} roles", PermissionSeederConfig.DefaultRoles.Count);

        // 3. Sync role → permission mappings
        foreach (var (roleName, patterns) in PermissionSeederConfig.DefaultRoles)
        {
            var role = existingRoles[roleName];

            // Expand wildcard patterns to actual permission names
            var resolvedPermissionNames = new HashSet<string>();
            foreach (var pattern in patterns)
            {
                if (pattern.EndsWith(":*", StringComparison.Ordinal))
                {
                    var prefix = pattern[..^1]; // keep trailing ":"
                    foreach (
                        var p in allPermissionNames.Where(p =>
                            p.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)
                        )
                    )
                        resolvedPermissionNames.Add(p);
                }
                else
                {
                    resolvedPermissionNames.Add(pattern);
                }
            }

            // Get current role-permission mappings
            var currentPermIds = await db
                .RolePermissions.Where(rp => rp.RoleId == role.Id)
                .Select(rp => rp.PermissionId)
                .ToHashSetAsync();

            // Add missing mappings
            foreach (var permName in resolvedPermissionNames)
            {
                if (
                    existingPermissions.TryGetValue(permName, out var perm)
                    && !currentPermIds.Contains(perm.Id)
                )
                {
                    db.RolePermissions.Add(
                        new RolePermission { RoleId = role.Id, PermissionId = perm.Id }
                    );
                }
            }

            // Remove stale mappings (permissions that are no longer in the patterns)
            var desiredPermIds = resolvedPermissionNames
                .Where(n => existingPermissions.ContainsKey(n))
                .Select(n => existingPermissions[n].Id)
                .ToHashSet();

            var staleIds = currentPermIds.Except(desiredPermIds);
            if (staleIds.Any())
            {
                var stale = await db
                    .RolePermissions.Where(rp =>
                        rp.RoleId == role.Id && staleIds.Contains(rp.PermissionId)
                    )
                    .ToListAsync();
                db.RolePermissions.RemoveRange(stale);
            }
        }

        await db.SaveChangesAsync();
        logger.LogInformation("Role-permission mappings synced");
    }
}
