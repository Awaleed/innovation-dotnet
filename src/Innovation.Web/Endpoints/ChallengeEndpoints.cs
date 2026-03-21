using ErrorOr;
using Innovation.Application.Common.Models;
using Innovation.Application.Features.Challenges;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Innovation.Web.Endpoints;

public static class ChallengeEndpoints
{
    public static void MapChallengeEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/v1/challenges")
            .WithTags("Challenges");

        group.MapPost("/", async ([FromBody] CreateChallengeCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            return result.Match(
                value => Results.Created($"/api/v1/challenges/{value.Id}", value),
                errors => ToProblems(errors));
        });

        group.MapGet("/", async (
            [FromQuery] int page,
            [FromQuery] int pageSize,
            [FromQuery] string? filter,
            [FromQuery] string? orderBy,
            IMediator mediator) =>
        {
            var query = new ListChallengesQuery(
                page > 0 ? page : 1,
                pageSize > 0 ? pageSize : 15,
                filter, orderBy);
            var result = await mediator.Send(query);
            return result.Match(
                value => Results.Ok(value.ToSimpleCollection("/api/v1/challenges")),
                errors => ToProblems(errors));
        });

        group.MapGet("/{id:int}", async (int id, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetChallengeQuery(id));
            return result.Match(
                value => Results.Ok(value),
                errors => ToProblems(errors));
        });

        group.MapPut("/{id:int}", async (int id, [FromBody] UpdateChallengeCommand command, IMediator mediator) =>
        {
            var cmd = command with { Id = id };
            var result = await mediator.Send(cmd);
            return result.Match(
                value => Results.Ok(value),
                errors => ToProblems(errors));
        });

        group.MapDelete("/{id:int}", async (int id, IMediator mediator) =>
        {
            var result = await mediator.Send(new DeleteChallengeCommand(id));
            return result.Match(
                _ => Results.NoContent(),
                errors => ToProblems(errors));
        });

        group.MapPost("/{id:int}/advance", async (int id, IMediator mediator) =>
        {
            var result = await mediator.Send(new AdvanceChallengeStageCommand(id));
            return result.Match(
                value => Results.Ok(value),
                errors => ToProblems(errors));
        });
    }

    private static IResult ToProblems(List<Error> errors)
    {
        var first = errors.First();
        return first.Type switch
        {
            ErrorType.NotFound => Results.NotFound(new { error = first.Description }),
            ErrorType.Validation => Results.BadRequest(new { errors = errors.Select(e => e.Description) }),
            ErrorType.Conflict => Results.Conflict(new { error = first.Description }),
            ErrorType.Forbidden => Results.Forbid(),
            _ => Results.Problem(first.Description)
        };
    }
}
