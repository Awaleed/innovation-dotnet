namespace Innovation.Domain.Entities;

public class User : BaseEntity
{
    public string KeycloakId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Password { get; set; }
    public DateTime? EmailVerifiedAt { get; set; }
}
