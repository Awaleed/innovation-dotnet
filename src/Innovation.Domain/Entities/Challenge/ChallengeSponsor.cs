namespace Innovation.Domain.Entities.Challenge;

public class ChallengeSponsor : BaseEntity
{
    public int ChallengeId { get; set; }
    public string SponsorName { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? Description { get; set; }
    public decimal? ContributionAmount { get; set; }
    public string? SponsorshipType { get; set; }
    public int OrderIndex { get; set; }

    public Challenge Challenge { get; set; } = null!;
}
