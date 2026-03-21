using ErrorOr;
using Gridify;
using Gridify.EntityFramework;
using Innovation.Application.Common.Interfaces;
using Innovation.Application.Common.Models;
using Innovation.Application.Features.Challenges.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Innovation.Application.Features.Challenges;

public record ListChallengesQuery(
    int Page = 1,
    int PageSize = 15,
    string? Filter = null,
    string? OrderBy = null
) : IQuery<ErrorOr<PaginatedList<ApiResource<ChallengeListAttributes>>>>;

public class ListChallengesHandler(IAppDbContext db)
    : IRequestHandler<ListChallengesQuery, ErrorOr<PaginatedList<ApiResource<ChallengeListAttributes>>>>
{
    private static readonly IGridifyMapper<Innovation.Domain.Entities.Challenge.Challenge> Mapper = new GridifyMapper<Innovation.Domain.Entities.Challenge.Challenge>()
        .AddMap("status", c => c.Status)
        .AddMap("difficulty", c => c.Difficulty)
        .AddMap("featured", c => c.Featured)
        .AddMap("urgent", c => c.Urgent)
        .AddMap("isPublic", c => c.IsPublic)
        .AddMap("startDate", c => c.StartDate)
        .AddMap("endDate", c => c.EndDate)
        .AddMap("createdAt", c => c.CreatedAt)
        .AddMap("title", c => c.Title.En!)
        .AddMap("titleAr", c => c.Title.Ar!);

    public async Task<ErrorOr<PaginatedList<ApiResource<ChallengeListAttributes>>>> Handle(
        ListChallengesQuery query, CancellationToken ct)
    {
        var q = db.Challenges.AsNoTracking().AsQueryable();

        var gridifyQuery = new GridifyQuery
        {
            Filter = query.Filter,
            OrderBy = query.OrderBy ?? "createdAt desc",
            Page = query.Page,
            PageSize = query.PageSize
        };

        var paging = await q.GridifyAsync(gridifyQuery, Mapper);

        var items = paging.Data.Select(c => c.ToListResource()).ToList();

        return new PaginatedList<ApiResource<ChallengeListAttributes>>(
            items, paging.Count, query.Page, query.PageSize);
    }
}
