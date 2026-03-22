using ErrorOr;
using Innovation.Application.Common.Extensions;
using Innovation.Application.Common.Interfaces;
using Innovation.Application.Common.Models;
using Innovation.Application.Features.Challenges.Filters;
using Innovation.Application.Features.Challenges.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Innovation.Application.Features.Challenges.Queries;

public record ListChallengesQuery(ChallengeFilteredQuery Query)
    : IQuery<ErrorOr<PaginatedResponse<ChallengeListResponse>>>;

public class ListChallengesHandler(IAppDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<ListChallengesQuery, ErrorOr<PaginatedResponse<ChallengeListResponse>>>
{
    public async Task<ErrorOr<PaginatedResponse<ChallengeListResponse>>> Handle(
        ListChallengesQuery request,
        CancellationToken ct
    )
    {
        var locale = currentUser.Locale;

        var paging = await db.Challenges.AsNoTracking().ApplyFilteredAsync(request.Query);

        var items = paging
            .Data.Select(c => new ChallengeListResponse(
                c.Id,
                c.PublicUlid ?? "",
                c.Title.Get(locale),
                c.Slug?.GetOrNull(locale),
                c.Status.ToString(),
                c.Difficulty?.ToString(),
                c.Organizer?.GetOrNull(locale),
                c.StartDate?.ToString("yyyy-MM-dd"),
                c.EndDate?.ToString("yyyy-MM-dd"),
                c.Featured,
                c.Urgent,
                c.IsPublic,
                c.MaxParticipants,
                c.CreatedAt.ToString("o")
            ))
            .ToList();

        return PaginatedResponse<ChallengeListResponse>.Create(
            items,
            paging.Count,
            request.Query.Page,
            request.Query.PageSize
        );
    }
}
