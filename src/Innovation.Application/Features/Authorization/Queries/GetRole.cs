using ErrorOr;
using Innovation.Application.Common.Interfaces;
using Innovation.Application.Features.Authorization.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Innovation.Application.Features.Authorization.Queries;

public record GetRoleQuery(int Id) : IRequest<ErrorOr<RoleResponse>>;

public class GetRoleHandler(IAppDbContext db) : IRequestHandler<GetRoleQuery, ErrorOr<RoleResponse>>
{
    public async Task<ErrorOr<RoleResponse>> Handle(GetRoleQuery request, CancellationToken ct)
    {
        var role = await db
            .Roles.AsNoTracking()
            .Include(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(r => r.Id == request.Id, ct);

        if (role is null)
            return Error.NotFound(description: $"Role with ID {request.Id} not found.");

        return new RoleResponse(
            role.Id,
            role.Name,
            role.GuardName,
            role.RolePermissions.Select(rp => rp.Permission.Name).OrderBy(n => n).ToList()
        );
    }
}
