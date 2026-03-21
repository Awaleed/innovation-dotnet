using Innovation.Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Innovation.Infrastructure;

public static class MediatorExtension
{
    /// <summary>
    /// Dispatches all domain events from entities tracked by the DbContext.
    /// Called before SaveChangesAsync to ensure events are published within the same transaction.
    /// Following eShop's pattern from Ordering.Infrastructure.
    /// </summary>
    public static async Task DispatchDomainEventsAsync(this IMediator mediator, DbContext ctx)
    {
        var domainEntities = ctx
            .ChangeTracker.Entries<BaseEntity>()
            .Where(x => x.Entity.DomainEvents.Count != 0)
            .ToList();

        var domainEvents = domainEntities.SelectMany(x => x.Entity.DomainEvents).ToList();

        domainEntities.ForEach(entity => entity.Entity.ClearDomainEvents());

        foreach (var domainEvent in domainEvents)
        {
            await mediator.Publish(domainEvent);
        }
    }
}
