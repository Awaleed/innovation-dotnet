namespace Innovation.Application.Features.Authorization.Models;

public record RoleResponse(int Id, string Name, string GuardName, List<string> Permissions);

public record RoleListResponse(int Id, string Name, int PermissionCount, int UserCount);
