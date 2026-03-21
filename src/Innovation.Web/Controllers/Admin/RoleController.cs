using InertiaCore;
using Innovation.Application.Features.Authorization.Commands;
using Innovation.Application.Features.Authorization.Queries;
using Innovation.Web.Authorization;
using Innovation.Web.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Innovation.Web.Controllers.Admin;

[HasPermission("admin:roles:read")]
[Route("admin/roles")]
public class RoleController(IMediator mediator) : Controller
{
    [HttpGet("")]
    public async Task<IActionResult> Index()
    {
        var result = await mediator.Send(new ListRolesQuery());

        if (Request.ExpectsJson())
            return result.ToActionResult();

        return Inertia.Render(
            "Admin/Roles/Index",
            new { roles = result.IsError ? null : result.Value }
        );
    }

    [HttpGet("create")]
    public IActionResult Create()
    {
        return Inertia.Render("Admin/Roles/Create");
    }

    [HttpPost("")]
    [HasPermission("admin:roles:create")]
    public async Task<IActionResult> Store([FromBody] CreateRoleCommand command)
    {
        var result = await mediator.Send(command);

        if (Request.ExpectsJson())
        {
            return result.ToActionResult(value =>
                CreatedAtAction(nameof(Show), new { id = value }, new { id = value })
            );
        }

        return result.Match<IActionResult>(
            value => RedirectToAction(nameof(Show), new { id = value }),
            _ => RedirectToAction(nameof(Create))
        );
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Show(int id)
    {
        var result = await mediator.Send(new GetRoleQuery(id));

        if (Request.ExpectsJson())
            return result.ToActionResult();

        if (result.IsError)
            return NotFound();

        return Inertia.Render("Admin/Roles/Show", new { role = result.Value });
    }

    [HttpGet("{id:int}/edit")]
    public async Task<IActionResult> Edit(int id)
    {
        var result = await mediator.Send(new GetRoleQuery(id));

        if (result.IsError)
            return NotFound();

        return Inertia.Render("Admin/Roles/Edit", new { role = result.Value });
    }

    [HttpPut("{id:int}")]
    [HasPermission("admin:roles:update")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateRoleCommand command)
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
    [HasPermission("admin:roles:delete")]
    public async Task<IActionResult> Destroy(int id)
    {
        var result = await mediator.Send(new DeleteRoleCommand(id));

        if (Request.ExpectsJson())
            return result.ToActionResult(_ => NoContent());

        return result.Match<IActionResult>(
            _ => RedirectToAction(nameof(Index)),
            _ => RedirectToAction(nameof(Index))
        );
    }
}
