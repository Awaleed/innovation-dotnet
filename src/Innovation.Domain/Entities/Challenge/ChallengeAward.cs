namespace Innovation.Domain.Entities.Challenge;

public class ChallengeAward : BaseEntity
{
    public int ChallengeId { get; set; }
    public TranslatableString Name { get; set; } = new();
    public TranslatableString? Description { get; set; }
    public string? AwardType { get; set; }
    public decimal? Value { get; set; }
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public int OrderIndex { get; set; }

    public Challenge Challenge { get; set; } = null!;
}
