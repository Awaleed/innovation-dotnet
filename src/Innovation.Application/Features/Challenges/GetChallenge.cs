using ErrorOr;
using Innovation.Application.Common.Interfaces;
using Innovation.Application.Common.Models;
using Innovation.Application.Features.Challenges.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Innovation.Application.Features.Challenges;

public record GetChallengeQuery(int Id) : IQuery<ErrorOr<ApiResource<ChallengeDetailAttributes>>>;

public class GetChallengeHandler(IAppDbContext db)
    : IRequestHandler<GetChallengeQuery, ErrorOr<ApiResource<ChallengeDetailAttributes>>>
{
    public async Task<ErrorOr<ApiResource<ChallengeDetailAttributes>>> Handle(GetChallengeQuery query, CancellationToken ct)
    {
        var challenge = await db.Challenges
            .Include(c => c.Awards.OrderBy(a => a.OrderIndex))
            .Include(c => c.Objectives.OrderBy(o => o.OrderIndex))
            .Include(c => c.Requirements.OrderBy(r => r.OrderIndex))
            .Include(c => c.Timeline.OrderBy(t => t.OrderIndex))
            .Include(c => c.Sponsors.OrderBy(s => s.OrderIndex))
            .FirstOrDefaultAsync(c => c.Id == query.Id, ct);

        if (challenge is null)
            return Error.NotFound(description: $"Challenge {query.Id} not found");

        return challenge.ToDetailResource();
    }
}
