using Innovation.Application.Common.Interfaces;
using Innovation.Application.Common.Models;
using Innovation.Application.Features.Challenges.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Innovation.Application.Features.Challenges;

public record AdvanceChallengeStageCommand(int Id) : ICommand<Result<ApiResource<ChallengeDetailAttributes>>>;

public class AdvanceChallengeStageHandler(IAppDbContext db)
    : IRequestHandler<AdvanceChallengeStageCommand, Result<ApiResource<ChallengeDetailAttributes>>>
{
    public async Task<Result<ApiResource<ChallengeDetailAttributes>>> Handle(AdvanceChallengeStageCommand cmd, CancellationToken ct)
    {
        var challenge = await db.Challenges
            .Include(c => c.Awards)
            .Include(c => c.Objectives)
            .Include(c => c.Requirements)
            .Include(c => c.Timeline)
            .Include(c => c.Sponsors)
            .FirstOrDefaultAsync(c => c.Id == cmd.Id, ct);

        if (challenge is null)
            return Result<ApiResource<ChallengeDetailAttributes>>.NotFound();

        if (!challenge.TryAdvanceStage())
            return Result<ApiResource<ChallengeDetailAttributes>>.Failure(
                $"Cannot advance from status '{challenge.Status}'. It is a terminal state.");

        await db.SaveChangesAsync(ct);

        return Result<ApiResource<ChallengeDetailAttributes>>.Success(challenge.ToDetailResource());
    }
}
