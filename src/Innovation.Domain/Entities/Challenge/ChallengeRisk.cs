namespace Innovation.Domain.Entities.Challenge;

public class ChallengeRisk : BaseEntity
{
    public int ChallengeId { get; set; }
    public TranslatableString RiskName { get; set; } = new();
    public TranslatableString? Description { get; set; }
    public string? Probability { get; set; }
    public string? Impact { get; set; }
    public TranslatableString? MitigationStrategy { get; set; }
    public int? OwnerId { get; set; }
    public string? Status { get; set; }
    public int OrderIndex { get; set; }

    public Challenge Challenge { get; set; } = null!;
    public User? Owner { get; set; }
}
