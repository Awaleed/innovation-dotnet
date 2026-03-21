using Innovation.Application.Common.Interfaces;
using Innovation.Application.Common.Models;
using Innovation.Application.Features.Challenges.Shared;
using Innovation.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Innovation.Application.Features.Challenges;

public record ListChallengesQuery(
    int Page = 1,
    int PageSize = 15,
    string? Search = null,
    ChallengeStatus? Status = null,
    bool? Featured = null
) : IQuery<Result<PaginatedList<ApiResource<ChallengeListAttributes>>>>;

public class ListChallengesHandler(IAppDbContext db)
    : IRequestHandler<ListChallengesQuery, Result<PaginatedList<ApiResource<ChallengeListAttributes>>>>
{
    public async Task<Result<PaginatedList<ApiResource<ChallengeListAttributes>>>> Handle(
        ListChallengesQuery query, CancellationToken ct)
    {
        var q = db.Challenges.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.ToLower();
            q = q.Where(c => c.Title.En != null && c.Title.En.ToLower().Contains(search)
                           || c.Title.Ar != null && c.Title.Ar.ToLower().Contains(search));
        }

        if (query.Status.HasValue)
            q = q.Where(c => c.Status == query.Status.Value);

        if (query.Featured.HasValue)
            q = q.Where(c => c.Featured == query.Featured.Value);

        q = q.OrderByDescending(c => c.CreatedAt);

        // Paginate entities first, then map to ApiResource (can't translate dictionaries to SQL)
        var count = await q.CountAsync(ct);
        var entities = await q
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(ct);

        var items = entities.Select(c => c.ToListResource()).ToList();
        var paginatedList = new PaginatedList<ApiResource<ChallengeListAttributes>>(
            items, count, query.Page, query.PageSize);

        return Result<PaginatedList<ApiResource<ChallengeListAttributes>>>.Success(paginatedList);
    }
}
