using Innovation.Application.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Innovation.Application.Behaviors;

/// <summary>
/// Wraps command handlers in a database transaction.
/// Only applies to ICommand requests (not queries).
/// Following eShop's TransactionBehavior pattern.
/// </summary>
public class TransactionBehavior<TRequest, TResponse>(
    IAppDbContext db,
    ILogger<TransactionBehavior<TRequest, TResponse>> logger)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : ICommand<TResponse>
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var typeName = typeof(TRequest).Name;

        // If there's already an active transaction, just proceed
        if (db.Database.CurrentTransaction is not null)
        {
            return await next(cancellationToken);
        }

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            logger.LogInformation("Begin transaction for {CommandName}", typeName);

            var response = await next(cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            logger.LogInformation("Committed transaction for {CommandName}", typeName);

            return response;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error handling transaction for {CommandName}, rolling back", typeName);
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
