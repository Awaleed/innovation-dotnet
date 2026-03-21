using ErrorOr;
using FluentValidation;
using Innovation.Application.Common.Interfaces;
using MediatR;

namespace Innovation.Application.Features.Authorization.Commands;

public record AssignRoleToUserCommand(int UserId, string RoleName) : IRequest<ErrorOr<Success>>;

public class AssignRoleToUserValidator : AbstractValidator<AssignRoleToUserCommand>
{
    public AssignRoleToUserValidator()
    {
        RuleFor(x => x.UserId).GreaterThan(0);
        RuleFor(x => x.RoleName).NotEmpty().MaximumLength(125);
    }
}

public class AssignRoleToUserHandler(IPermissionService permissionService)
    : IRequestHandler<AssignRoleToUserCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(
        AssignRoleToUserCommand request,
        CancellationToken ct
    )
    {
        await permissionService.AssignRoleAsync(request.UserId, request.RoleName, ct);
        return Result.Success;
    }
}
