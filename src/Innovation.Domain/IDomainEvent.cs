using MediatR;

namespace Innovation.Domain;

/// <summary>
/// Marker interface for domain events, dispatched via MediatR notifications.
/// </summary>
public interface IDomainEvent : INotification;
