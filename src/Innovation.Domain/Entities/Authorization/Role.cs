namespace Innovation.Domain.Entities.Authorization;

public class Role : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string GuardName { get; set; } = "web";

    public ICollection<RolePermission> RolePermissions { get; set; } = [];
    public ICollection<UserRole> UserRoles { get; set; } = [];
}
