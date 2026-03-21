using InertiaCore;
using Innovation.Application.Features.Challenges.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Innovation.Web.Controllers.Admin;

[Authorize]
[Route("admin/challenges")]
public class ChallengeController(IMediator mediator) : Controller
{
    private string GetLocale() =>
        Request.Headers.AcceptLanguage.FirstOrDefault()?.Split(',').FirstOrDefault() ?? "en";

    [HttpGet("")]
    public async Task<IActionResult> Index(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15,
        [FromQuery] string? filter = null,
        [FromQuery] string? orderBy = null
    )
    {
        var result = await mediator.Send(
            new ListChallengesQuery(page, pageSize, filter, orderBy, GetLocale())
        );

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

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Show(int id)
    {
        var result = await mediator.Send(new GetChallengeQuery(id, GetLocale()));

        if (result.IsError)
            return NotFound();

        return Inertia.Render("Admin/Challenges/Show", new { challenge = result.Value });
    }

    [HttpGet("{id:int}/edit")]
    public async Task<IActionResult> Edit(int id)
    {
        var result = await mediator.Send(new GetChallengeQuery(id, GetLocale()));

        if (result.IsError)
            return NotFound();

        return Inertia.Render("Admin/Challenges/Edit", new { challenge = result.Value });
    }
}
