using ErrorOr;
using Innovation.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Innovation.Application.Features.Challenges.Commands;

public record DeleteChallengeCommand(int Id) : ICommand<ErrorOr<Deleted>>;

public class DeleteChallengeHandler(IAppDbContext db) : IRequestHandler<DeleteChallengeCommand, ErrorOr<Deleted>>
{
    public async Task<ErrorOr<Deleted>> Handle(DeleteChallengeCommand cmd, CancellationToken ct)
    {
        var challenge = await db.Challenges.FirstOrDefaultAsync(c => c.Id == cmd.Id, ct);

        if (challenge is null)
            return Error.NotFound(description: $"Challenge {cmd.Id} not found");

        // SoftDeleteInterceptor will convert this to a soft delete
        db.Challenges.Remove(challenge);
        await db.SaveChangesAsync(ct);

        return Result.Deleted;
    }
}
