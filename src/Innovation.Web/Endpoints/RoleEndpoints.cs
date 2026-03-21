using Innovation.Application.Features.Authorization.Commands;
using Innovation.Application.Features.Authorization.Queries;
using Innovation.Web.Authorization;
using MediatR;

namespace Innovation.Web.Endpoints;

public static class RoleEndpoints
{
    public static void MapRoleEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/roles").WithTags("Roles").RequireAuthorization();

        group
            .MapGet(
                "/",
                [HasPermission("admin:roles:read")]
                async (ISender sender) =>
                {
                    var result = await sender.Send(new ListRolesQuery());
                    return result.Match(Results.Ok, errors => Results.Problem());
                }
            )
            .WithName("ListRoles");

        group
            .MapGet(
                "/{id:int}",
                [HasPermission("admin:roles:read")]
                async (int id, ISender sender) =>
                {
                    var result = await sender.Send(new GetRoleQuery(id));
                    return result.Match(
                        Results.Ok,
                        errors =>
                            errors.First().Type == ErrorOr.ErrorType.NotFound
                                ? Results.NotFound()
                                : Results.Problem()
                    );
                }
            )
            .WithName("GetRole");

        group
            .MapPost(
                "/",
                [HasPermission("admin:roles:create")]
                async (CreateRoleCommand command, ISender sender) =>
                {
                    var result = await sender.Send(command);
                    return result.Match(
                        id => Results.Created($"/api/roles/{id}", new { id }),
                        errors =>
                            errors.First().Type == ErrorOr.ErrorType.Conflict
                                ? Results.Conflict(new { message = errors.First().Description })
                                : Results.Problem()
                    );
                }
            )
            .WithName("CreateRole");

        group
            .MapPut(
                "/{id:int}",
                [HasPermission("admin:roles:update")]
                async (int id, UpdateRoleCommand command, ISender sender) =>
                {
                    if (id != command.Id)
                        return Results.BadRequest();

                    var result = await sender.Send(command);
                    return result.Match(
                        _ => Results.Ok(),
                        errors =>
                            errors.First().Type switch
                            {
                                ErrorOr.ErrorType.NotFound => Results.NotFound(),
                                ErrorOr.ErrorType.Conflict => Results.Conflict(
                                    new { message = errors.First().Description }
                                ),
                                _ => Results.Problem(),
                            }
                    );
                }
            )
            .WithName("UpdateRole");

        group
            .MapDelete(
                "/{id:int}",
                [HasPermission("admin:roles:delete")]
                async (int id, ISender sender) =>
                {
                    var result = await sender.Send(new DeleteRoleCommand(id));
                    return result.Match(
                        _ => Results.NoContent(),
                        errors =>
                            errors.First().Type == ErrorOr.ErrorType.NotFound
                                ? Results.NotFound()
                                : Results.Problem()
                    );
                }
            )
            .WithName("DeleteRole");

        group
            .MapPost(
                "/assign",
                [HasPermission("admin:roles:assign")]
                async (AssignRoleToUserCommand command, ISender sender) =>
                {
                    var result = await sender.Send(command);
                    return result.Match(_ => Results.Ok(), errors => Results.Problem());
                }
            )
            .WithName("AssignRoleToUser");

        group
            .MapPost(
                "/sync",
                [HasPermission("admin:roles:assign")]
                async (SyncUserRolesCommand command, ISender sender) =>
                {
                    var result = await sender.Send(command);
                    return result.Match(_ => Results.Ok(), errors => Results.Problem());
                }
            )
            .WithName("SyncUserRoles");
    }
}
