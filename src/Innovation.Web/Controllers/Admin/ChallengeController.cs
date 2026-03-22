using ErrorOr;
using Gridify;
using InertiaCore;
using Innovation.Application.Features.Challenges.Commands;
using Innovation.Application.Features.Challenges.Queries;
using Innovation.Web.Authorization;
using Innovation.Web.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Innovation.Web.Controllers.Admin;

[HasPermission("admin:challenges:read")]
[Route("admin/challenges")]
public class ChallengeController(IMediator mediator) : Controller
{
    [HttpGet("")]
    public async Task<IActionResult> Index([FromQuery] GridifyQuery gridifyQuery)
    {
        var result = await mediator.Send(new ListChallengesQuery(gridifyQuery));

        if (Request.ExpectsJson())
            return result.ToActionResult();

        return Inertia.Render(
            "Admin/Challenges/Index",
            new { challenges = result.IsError ? null : result.Value }
        );
    }

    [HttpGet("create")]
    public IActionResult Create()
    {
        return Inertia.Render("Admin/Challenges/Create");
    }

    [HttpPost("")]
    public async Task<IActionResult> Store([FromBody] CreateChallengeCommand command)
    {
        var result = await mediator.Send(command);

        if (Request.ExpectsJson())
        {
            return result.ToActionResult(value =>
                CreatedAtAction(nameof(Show), new { id = value.Id }, value)
            );
        }

        return result.Match<IActionResult>(
            value => RedirectToAction(nameof(Show), new { id = value.Id }),
            _ => RedirectToAction(nameof(Create))
        );
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Show(int id)
    {
        var result = await mediator.Send(new GetChallengeQuery(id));

        if (Request.ExpectsJson())
            return result.ToActionResult();

        if (result.IsError)
            return NotFound();

        return Inertia.Render("Admin/Challenges/Show", new { challenge = result.Value });
    }

    [HttpGet("{id:int}/edit")]
    public async Task<IActionResult> Edit(int id)
    {
        var result = await mediator.Send(new GetChallengeQuery(id));

        if (result.IsError)
            return NotFound();

        return Inertia.Render("Admin/Challenges/Edit", new { challenge = result.Value });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateChallengeCommand command)
    {
        var cmd = command with { Id = id };
        var result = await mediator.Send(cmd);

        if (Request.ExpectsJson())
            return result.ToActionResult();

        return result.Match<IActionResult>(
            _ => RedirectToAction(nameof(Show), new { id }),
            _ => RedirectToAction(nameof(Edit), new { id })
        );
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Destroy(int id)
    {
        var result = await mediator.Send(new DeleteChallengeCommand(id));

        if (Request.ExpectsJson())
            return result.ToActionResult(_ => NoContent());

        return result.Match<IActionResult>(
            _ => RedirectToAction(nameof(Index)),
            _ => RedirectToAction(nameof(Index))
        );
    }

    [HttpPost("{id:int}/advance")]
    public async Task<IActionResult> Advance(int id)
    {
        var result = await mediator.Send(new AdvanceChallengeStageCommand(id));
        return result.ToActionResult();
    }
}
