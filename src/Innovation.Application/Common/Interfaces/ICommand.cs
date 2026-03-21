using MediatR;

namespace Innovation.Application.Common.Interfaces;

public interface ICommand<out TResponse> : IRequest<TResponse>;
