using Microsoft.AspNetCore.Identity;

namespace Innovation.Identity.API.Models;

public class ApplicationUser : IdentityUser
{
    public required string Name { get; set; }
    public DateTime? EmailVerifiedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }

    public bool IsDeleted => DeletedAt.HasValue;
}
