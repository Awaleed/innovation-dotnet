using ErrorOr;
using Innovation.Application.Common.Interfaces;
using Innovation.Application.Features.Authorization.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Innovation.Application.Features.Authorization.Queries;

public record ListRolesQuery : IRequest<ErrorOr<List<RoleListResponse>>>;

public class ListRolesHandler(IAppDbContext db)
    : IRequestHandler<ListRolesQuery, ErrorOr<List<RoleListResponse>>>
{
    public async Task<ErrorOr<List<RoleListResponse>>> Handle(
        ListRolesQuery request,
        CancellationToken ct
    )
    {
        var roles = await db
            .Roles.AsNoTracking()
            .Select(r => new RoleListResponse(
                r.Id,
                r.Name,
                r.RolePermissions.Count,
                r.UserRoles.Count
            ))
            .OrderBy(r => r.Name)
            .ToListAsync(ct);

        return roles;
    }
}
