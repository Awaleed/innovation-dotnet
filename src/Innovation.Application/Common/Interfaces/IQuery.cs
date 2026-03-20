using MediatR;

namespace Innovation.Application.Common.Interfaces;

public interface IQuery<out TResponse> : IRequest<TResponse>;
