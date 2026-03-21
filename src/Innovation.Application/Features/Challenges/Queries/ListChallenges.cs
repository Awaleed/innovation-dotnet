using ErrorOr;
using Gridify;
using Gridify.EntityFramework;
using Innovation.Application.Common.Interfaces;
using Innovation.Application.Common.Models;
using Innovation.Application.Features.Challenges.Filters;
using Innovation.Application.Features.Challenges.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Innovation.Application.Features.Challenges.Queries;

public record ListChallengesQuery(
    int Page = 1,
    int PageSize = 15,
    string? Filter = null,
    string? OrderBy = null,
    string Locale = "en"
) : IQuery<ErrorOr<PaginatedResponse<ChallengeListResponse>>>;

public class ListChallengesHandler(IAppDbContext db)
    : IRequestHandler<ListChallengesQuery, ErrorOr<PaginatedResponse<ChallengeListResponse>>>
{
    private static readonly ChallengeGridifyMapper _mapper = new();

    public async Task<ErrorOr<PaginatedResponse<ChallengeListResponse>>> Handle(
        ListChallengesQuery request,
        CancellationToken ct
    )
    {
        var locale = request.Locale;
        var query = db.Challenges.AsNoTracking();

        var gridifyQuery = new GridifyQuery
        {
            Filter = request.Filter,
            OrderBy = request.OrderBy ?? "createdAt desc",
            Page = request.Page,
            PageSize = request.PageSize,
        };

        var paging = await query.GridifyAsync(gridifyQuery, _mapper);

        // Map entities to flat DTOs after materialization
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
            request.Page,
            request.PageSize
        );
    }
}
