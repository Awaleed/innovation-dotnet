using System.Security.Claims;
using Innovation.Application.Common.Constants;
using Innovation.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;

namespace Innovation.Infrastructure.Services;

public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    public int? LocalUserId
    {
        get
        {
            var value = httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimConstants.LocalUserId);
            return value is not null ? int.Parse(value) : null;
        }
    }

    public string? UserId => httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
    public string? UserName => httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.GivenName);
    public string? Email => httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.Email);
    public bool IsAuthenticated => httpContextAccessor.HttpContext?.User.Identity?.IsAuthenticated ?? false;
    public IReadOnlyList<string> Roles => httpContextAccessor.HttpContext?.User
        .FindAll(ClaimTypes.Role).Select(c => c.Value).ToList().AsReadOnly() ?? [];
}
