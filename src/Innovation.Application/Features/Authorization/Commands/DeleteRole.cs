using ErrorOr;
using Innovation.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Innovation.Application.Features.Authorization.Commands;

public record DeleteRoleCommand(int Id) : IRequest<ErrorOr<Success>>;

public class DeleteRoleHandler(IAppDbContext db)
    : IRequestHandler<DeleteRoleCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(DeleteRoleCommand request, CancellationToken ct)
    {
        var role = await db.Roles.FirstOrDefaultAsync(r => r.Id == request.Id, ct);

        if (role is null)
            return Error.NotFound(description: $"Role with ID {request.Id} not found.");

        role.DeletedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return Result.Success;
    }
}
