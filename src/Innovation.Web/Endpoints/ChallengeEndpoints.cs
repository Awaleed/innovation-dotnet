using Innovation.Application.Features.Challenges;
using Innovation.Domain.Enums;
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
            return result.IsSuccess ? Results.Created($"/api/v1/challenges/{result.Value!.Id}", result.Value) : Results.BadRequest(result.Error);
        });

        group.MapGet("/", async (
            [FromQuery] int page,
            [FromQuery] int pageSize,
            [FromQuery] string? search,
            [FromQuery] ChallengeStatus? status,
            [FromQuery] bool? featured,
            IMediator mediator) =>
        {
            var query = new ListChallengesQuery(
                page > 0 ? page : 1,
                pageSize > 0 ? pageSize : 15,
                search, status, featured);
            var result = await mediator.Send(query);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        });

        group.MapGet("/{id:int}", async (int id, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetChallengeQuery(id));
            return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
        });

        group.MapPut("/{id:int}", async (int id, [FromBody] UpdateChallengeCommand command, IMediator mediator) =>
        {
            var cmd = command with { Id = id };
            var result = await mediator.Send(cmd);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
        });

        group.MapDelete("/{id:int}", async (int id, IMediator mediator) =>
        {
            var result = await mediator.Send(new DeleteChallengeCommand(id));
            return result.IsSuccess ? Results.NoContent() : Results.NotFound(result.Error);
        });

        group.MapPost("/{id:int}/advance", async (int id, IMediator mediator) =>
        {
            var result = await mediator.Send(new AdvanceChallengeStageCommand(id));
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        });
    }
}
