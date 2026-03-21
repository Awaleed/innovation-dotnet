using ErrorOr;
using Innovation.Application.Common.Interfaces;
using Innovation.Application.Common.Models;
using Innovation.Application.Features.Challenges.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Innovation.Application.Features.Challenges;

public record AdvanceChallengeStageCommand(int Id) : ICommand<ErrorOr<ApiResource<ChallengeDetailAttributes>>>;

public class AdvanceChallengeStageHandler(IAppDbContext db)
    : IRequestHandler<AdvanceChallengeStageCommand, ErrorOr<ApiResource<ChallengeDetailAttributes>>>
{
    public async Task<ErrorOr<ApiResource<ChallengeDetailAttributes>>> Handle(AdvanceChallengeStageCommand cmd, CancellationToken ct)
    {
        var challenge = await db.Challenges
            .Include(c => c.Awards)
            .Include(c => c.Objectives)
            .Include(c => c.Requirements)
            .Include(c => c.Timeline)
            .Include(c => c.Sponsors)
            .FirstOrDefaultAsync(c => c.Id == cmd.Id, ct);

        if (challenge is null)
            return Error.NotFound(description: $"Challenge {cmd.Id} not found");

        if (!challenge.TryAdvanceStage())
            return Error.Validation(description: $"Cannot advance from status '{challenge.Status}'. It is a terminal state.");

        await db.SaveChangesAsync(ct);

        return challenge.ToDetailResource();
    }
}
