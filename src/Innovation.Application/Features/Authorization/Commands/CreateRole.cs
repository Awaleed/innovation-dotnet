using ErrorOr;
using FluentValidation;
using Innovation.Application.Common.Interfaces;
using Innovation.Domain.Entities.Authorization;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Innovation.Application.Features.Authorization.Commands;

public record CreateRoleCommand(string Name, List<string>? Permissions = null)
    : IRequest<ErrorOr<int>>;

public class CreateRoleValidator : AbstractValidator<CreateRoleCommand>
{
    public CreateRoleValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(125);
    }
}

public class CreateRoleHandler(IAppDbContext db) : IRequestHandler<CreateRoleCommand, ErrorOr<int>>
{
    public async Task<ErrorOr<int>> Handle(CreateRoleCommand request, CancellationToken ct)
    {
        var exists = await db.Roles.AnyAsync(r => r.Name == request.Name, ct);
        if (exists)
            return Error.Conflict(description: $"Role '{request.Name}' already exists.");

        var role = new Role { Name = request.Name };
        db.Roles.Add(role);
        await db.SaveChangesAsync(ct);

        if (request.Permissions is { Count: > 0 })
        {
            var permissions = await db
                .Permissions.Where(p => request.Permissions.Contains(p.Name))
                .ToListAsync(ct);

            foreach (var perm in permissions)
            {
                db.RolePermissions.Add(
                    new RolePermission { RoleId = role.Id, PermissionId = perm.Id }
                );
            }

            await db.SaveChangesAsync(ct);
        }

        return role.Id;
    }
}
