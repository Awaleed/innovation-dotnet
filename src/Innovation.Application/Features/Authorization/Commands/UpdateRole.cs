using ErrorOr;
using FluentValidation;
using Innovation.Application.Common.Interfaces;
using Innovation.Domain.Entities.Authorization;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Innovation.Application.Features.Authorization.Commands;

public record UpdateRoleCommand(int Id, string Name, List<string> Permissions)
    : IRequest<ErrorOr<Success>>;

public class UpdateRoleValidator : AbstractValidator<UpdateRoleCommand>
{
    public UpdateRoleValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(125);
        RuleFor(x => x.Permissions).NotNull();
    }
}

public class UpdateRoleHandler(IAppDbContext db)
    : IRequestHandler<UpdateRoleCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(UpdateRoleCommand request, CancellationToken ct)
    {
        var role = await db
            .Roles.Include(r => r.RolePermissions)
            .FirstOrDefaultAsync(r => r.Id == request.Id, ct);

        if (role is null)
            return Error.NotFound(description: $"Role with ID {request.Id} not found.");

        var nameConflict = await db.Roles.AnyAsync(
            r => r.Name == request.Name && r.Id != request.Id,
            ct
        );
        if (nameConflict)
            return Error.Conflict(description: $"Role '{request.Name}' already exists.");

        role.Name = request.Name;

        // Sync permissions
        db.RolePermissions.RemoveRange(role.RolePermissions);

        var permissions = await db
            .Permissions.Where(p => request.Permissions.Contains(p.Name))
            .ToListAsync(ct);

        foreach (var perm in permissions)
        {
            db.RolePermissions.Add(new RolePermission { RoleId = role.Id, PermissionId = perm.Id });
        }

        await db.SaveChangesAsync(ct);
        return Result.Success;
    }
}
