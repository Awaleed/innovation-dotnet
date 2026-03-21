using InertiaCore;
using Innovation.Application.Common.Models;
using Innovation.Application.Features.Challenges;
using Innovation.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Innovation.Web.Controllers.Admin;

[Authorize]
[Route("admin/challenges")]
public class ChallengeController(IMediator mediator) : Controller
{
    [HttpGet("")]
    public async Task<IActionResult> Index(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15,
        [FromQuery] string? search = null,
        [FromQuery] ChallengeStatus? status = null,
        [FromQuery] bool? featured = null)
    {
        var result = await mediator.Send(new ListChallengesQuery(page, pageSize, search, status, featured));

        return Inertia.Render("Admin/Challenges/Index", new
        {
            challenges = result.IsError ? null : result.Value.ToSimpleCollection("/admin/challenges"),
        });
    }

    [HttpGet("create")]
    public IActionResult Create()
    {
        return Inertia.Render("Admin/Challenges/Create");
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Show(int id)
    {
        var result = await mediator.Send(new GetChallengeQuery(id));

        if (result.IsError)
            return NotFound();

        return Inertia.Render("Admin/Challenges/Show", new
        {
            challenge = result.Value,
        });
    }

    [HttpGet("{id:int}/edit")]
    public async Task<IActionResult> Edit(int id)
    {
        var result = await mediator.Send(new GetChallengeQuery(id));

        if (result.IsError)
            return NotFound();

        return Inertia.Render("Admin/Challenges/Edit", new
        {
            challenge = result.Value,
        });
    }
}
