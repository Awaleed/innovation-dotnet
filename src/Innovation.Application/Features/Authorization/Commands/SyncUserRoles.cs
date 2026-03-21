using ErrorOr;
using FluentValidation;
using Innovation.Application.Common.Interfaces;
using MediatR;

namespace Innovation.Application.Features.Authorization.Commands;

public record SyncUserRolesCommand(int UserId, List<string> RoleNames) : IRequest<ErrorOr<Success>>;

public class SyncUserRolesValidator : AbstractValidator<SyncUserRolesCommand>
{
    public SyncUserRolesValidator()
    {
        RuleFor(x => x.UserId).GreaterThan(0);
        RuleFor(x => x.RoleNames).NotNull();
    }
}

public class SyncUserRolesHandler(IPermissionService permissionService)
    : IRequestHandler<SyncUserRolesCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(SyncUserRolesCommand request, CancellationToken ct)
    {
        await permissionService.SyncRolesAsync(request.UserId, request.RoleNames, ct);
        return Result.Success;
    }
}
