namespace Innovation.Domain.Entities.Challenge;

public class ChallengeSustainabilityImpact : BaseEntity
{
    public int ChallengeId { get; set; }
    public TranslatableString? ImpactArea { get; set; }
    public TranslatableString? Description { get; set; }
    public string? SdgAlignment { get; set; } // JSON array
    public string? QuantifiableMetrics { get; set; } // JSON array
    public string? Timeline { get; set; }

    public Challenge Challenge { get; set; } = null!;
}
