using Innovation.Application.Common.Exceptions;
using Innovation.Application.Common.Interfaces;
using Innovation.Application.Common.Models;
using Innovation.Application.Features.Challenges.Shared;
using Innovation.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Innovation.Application.Features.Challenges;

public record AdvanceChallengeStageCommand(int Id) : ICommand<Result<ChallengeDetailResponse>>;

public class AdvanceChallengeStageHandler(IAppDbContext db) : IRequestHandler<AdvanceChallengeStageCommand, Result<ChallengeDetailResponse>>
{
    private static readonly Dictionary<ChallengeStatus, ChallengeStatus> Transitions = new()
    {
        { ChallengeStatus.Draft, ChallengeStatus.Upcoming },
        { ChallengeStatus.Upcoming, ChallengeStatus.Open },
        { ChallengeStatus.Open, ChallengeStatus.Closed },
        { ChallengeStatus.Closed, ChallengeStatus.Judging },
        { ChallengeStatus.Judging, ChallengeStatus.Voting },
        { ChallengeStatus.Voting, ChallengeStatus.Completed },
    };

    public async Task<Result<ChallengeDetailResponse>> Handle(AdvanceChallengeStageCommand cmd, CancellationToken ct)
    {
        var challenge = await db.Challenges
            .Include(c => c.Awards)
            .Include(c => c.Objectives)
            .Include(c => c.Requirements)
            .Include(c => c.Timeline)
            .Include(c => c.Sponsors)
            .FirstOrDefaultAsync(c => c.Id == cmd.Id, ct);

        if (challenge is null)
            return Result<ChallengeDetailResponse>.NotFound();

        if (!Transitions.TryGetValue(challenge.Status, out var nextStatus))
            return Result<ChallengeDetailResponse>.Failure(
                $"Cannot advance from status '{challenge.Status}'. It is a terminal state.");

        challenge.Status = nextStatus;
        await db.SaveChangesAsync(ct);

        return Result<ChallengeDetailResponse>.Success(challenge.ToDetailResponse());
    }
}
