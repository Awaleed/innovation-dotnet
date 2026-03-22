using ErrorOr;
using Innovation.Application.Common.Interfaces;
using Innovation.Application.Features.Challenges.Mappings;
using Innovation.Application.Features.Challenges.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Innovation.Application.Features.Challenges.Queries;

public record GetChallengeQuery(int Id) : IQuery<ErrorOr<ChallengeDetailResponse>>;

public class GetChallengeHandler(IAppDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetChallengeQuery, ErrorOr<ChallengeDetailResponse>>
{
    public async Task<ErrorOr<ChallengeDetailResponse>> Handle(
        GetChallengeQuery query,
        CancellationToken ct
    )
    {
        var challenge = await db
            .Challenges.AsNoTracking()
            .Include(c => c.Awards)
            .Include(c => c.Objectives)
            .Include(c => c.Requirements)
            .Include(c => c.Timeline)
            .Include(c => c.Sponsors)
            .AsSplitQuery()
            .FirstOrDefaultAsync(c => c.Id == query.Id, ct);

        if (challenge is null)
            return Error.NotFound(description: $"Challenge {query.Id} not found");

        return challenge.ToDetailResponse(currentUser.Locale);
    }
}
