namespace Innovation.Domain.Entities.Challenge;

public class ChallengeIntellectualProperty : BaseEntity
{
    public int ChallengeId { get; set; }
    public string? IpType { get; set; }
    public string? IpStatus { get; set; }
    public string? ProtectionMechanism { get; set; } // JSON array
    public string? OwnershipTerms { get; set; }
    public string? LicenseType { get; set; }
    public string? Notes { get; set; }

    public Challenge Challenge { get; set; } = null!;
}
