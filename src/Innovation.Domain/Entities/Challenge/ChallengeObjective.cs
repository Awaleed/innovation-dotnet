namespace Innovation.Domain.Entities.Challenge;

public class ChallengeObjective : BaseEntity
{
    public int ChallengeId { get; set; }
    public TranslatableString Objective { get; set; } = new();
    public TranslatableString? Description { get; set; }
    public TranslatableString? ExpectedOutcome { get; set; }
    public string? Metrics { get; set; } // JSON
    public int OrderIndex { get; set; }

    public Challenge Challenge { get; set; } = null!;
}
