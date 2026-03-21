namespace Innovation.Domain.Entities.Authorization;

public class Permission : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string GuardName { get; set; } = "web";

    public ICollection<RolePermission> RolePermissions { get; set; } = [];
    public ICollection<UserPermission> UserPermissions { get; set; } = [];
}
