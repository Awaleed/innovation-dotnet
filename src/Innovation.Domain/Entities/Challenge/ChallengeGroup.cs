namespace Innovation.Domain.Entities.Challenge;

public class ChallengeGroup : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Status { get; set; }
    public bool IsActive { get; set; } = true;
}
