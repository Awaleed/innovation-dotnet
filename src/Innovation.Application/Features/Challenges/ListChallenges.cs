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
) : IQuery<Result<PaginatedList<ChallengeListResponse>>>;

public class ListChallengesHandler(IAppDbContext db) : IRequestHandler<ListChallengesQuery, Result<PaginatedList<ChallengeListResponse>>>
{
    public async Task<Result<PaginatedList<ChallengeListResponse>>> Handle(ListChallengesQuery query, CancellationToken ct)
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

        var result = await PaginatedList<ChallengeListResponse>.CreateAsync(
            q.Select(c => c.ToListResponse()),
            query.Page,
            query.PageSize,
            ct);

        return Result<PaginatedList<ChallengeListResponse>>.Success(result);
    }
}
