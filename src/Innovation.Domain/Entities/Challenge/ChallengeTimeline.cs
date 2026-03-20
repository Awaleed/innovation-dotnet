namespace Innovation.Domain.Entities.Challenge;

public class ChallengeTimeline : BaseEntity
{
    public int ChallengeId { get; set; }
    public TranslatableString MilestoneName { get; set; } = new();
    public TranslatableString? Description { get; set; }
    public DateTime? MilestoneStartDate { get; set; }
    public DateTime? MilestoneEndDate { get; set; }
    public int OrderIndex { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Status { get; set; }
    public string? Deliverables { get; set; } // JSON

    public Challenge Challenge { get; set; } = null!;
}
