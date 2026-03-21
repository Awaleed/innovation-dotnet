using Innovation.Domain.Enums;

namespace Innovation.Domain.Entities.Challenge;

public class Challenge : BaseEntity
{
    public string? PublicUlid { get; set; }
    public TranslatableString Slug { get; set; } = new();
    public TranslatableString Title { get; set; } = new();
    public TranslatableString Description { get; set; } = new();
    public TranslatableString? Organizer { get; set; }
    public TranslatableString? Location { get; set; }

    // Foreign keys
    public int? CategoryId { get; set; }
    public int? InnovationTypeId { get; set; }
    public int? TemplateId { get; set; }

    // Dates
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? SubmissionDeadline { get; set; }
    public DateTime? EvaluationStartDate { get; set; }
    public DateTime? EvaluationEndDate { get; set; }
    public DateTime? WinnersAnnouncedAt { get; set; }

    // Configuration
    public ChallengeStatus Status { get; set; } = ChallengeStatus.Draft;
    public ChallengeDifficulty? Difficulty { get; set; }
    public ChallengeParticipationType? ParticipationType { get; set; }
    public ChallengeSubmissionType? SubmissionType { get; set; }
    public WinnerSelectionMethod? WinnerSelectionMethod { get; set; }

    public int? MaxParticipants { get; set; }
    public int? TeamSizeMin { get; set; }
    public int? TeamSizeMax { get; set; }
    public int? MinEvaluatorsPerIdea { get; set; }

    public string? Language { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }

    // Flags
    public bool Featured { get; set; }
    public bool Urgent { get; set; }
    public bool IsPublic { get; set; } = true;
    public bool EnableComments { get; set; } = true;
    public bool AutoTransitionEnabled { get; set; }

    // JSON
    public string? AutomationSettings { get; set; }

    public int SortOrder { get; set; }

    private static readonly Dictionary<ChallengeStatus, ChallengeStatus> StageTransitions = new()
    {
        { ChallengeStatus.Draft, ChallengeStatus.Upcoming },
        { ChallengeStatus.Upcoming, ChallengeStatus.Open },
        { ChallengeStatus.Open, ChallengeStatus.Closed },
        { ChallengeStatus.Closed, ChallengeStatus.Judging },
        { ChallengeStatus.Judging, ChallengeStatus.Voting },
        { ChallengeStatus.Voting, ChallengeStatus.Completed },
    };

    public bool TryAdvanceStage()
    {
        if (!StageTransitions.TryGetValue(Status, out var next))
            return false;

        Status = next;
        return true;
    }

    // Navigation properties
    public Lookup? Category { get; set; }
    public InnovationType? InnovationType { get; set; }
    public ICollection<ChallengeAward> Awards { get; set; } = [];
    public ICollection<ChallengeObjective> Objectives { get; set; } = [];
    public ICollection<ChallengeRequirement> Requirements { get; set; } = [];
    public ICollection<ChallengeTimeline> Timeline { get; set; } = [];
    public ICollection<ChallengeSponsor> Sponsors { get; set; } = [];
    public ICollection<ChallengeRisk> Risks { get; set; } = [];
    public ChallengeSustainabilityImpact? SustainabilityImpact { get; set; }
    public ChallengeIntellectualProperty? IntellectualProperty { get; set; }
    public ICollection<ChallengeUser> ChallengeUsers { get; set; } = [];
}
