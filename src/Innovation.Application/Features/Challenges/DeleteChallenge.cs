using Innovation.Application.Common.Interfaces;
using Innovation.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Innovation.Application.Features.Challenges;

public record DeleteChallengeCommand(int Id) : ICommand<Result<bool>>;

public class DeleteChallengeHandler(IAppDbContext db) : IRequestHandler<DeleteChallengeCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(DeleteChallengeCommand cmd, CancellationToken ct)
    {
        var challenge = await db.Challenges.FirstOrDefaultAsync(c => c.Id == cmd.Id, ct);

        if (challenge is null)
            return Result<bool>.NotFound();

        // SoftDeleteInterceptor will convert this to a soft delete
        db.Challenges.Remove(challenge);
        await db.SaveChangesAsync(ct);

        return Result<bool>.Success(true);
    }
}
