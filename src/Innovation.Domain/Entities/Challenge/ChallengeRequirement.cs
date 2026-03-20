namespace Innovation.Domain.Entities.Challenge;

public class ChallengeRequirement : BaseEntity
{
    public int ChallengeId { get; set; }
    public TranslatableString Requirement { get; set; } = new();
    public TranslatableString? Description { get; set; }
    public string? RequirementType { get; set; }
    public string? Priority { get; set; }
    public bool Mandatory { get; set; } = true;
    public int OrderIndex { get; set; }

    public Challenge Challenge { get; set; } = null!;
}
