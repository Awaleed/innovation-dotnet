namespace Innovation.Domain.Entities.Challenge;

public class ChallengeUser
{
    public int ChallengeId { get; set; }
    public int UserId { get; set; }
    public string Role { get; set; } = string.Empty; // "mentor", "jury", "participant"
    public string? Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Challenge Challenge { get; set; } = null!;
    public User User { get; set; } = null!;
}
