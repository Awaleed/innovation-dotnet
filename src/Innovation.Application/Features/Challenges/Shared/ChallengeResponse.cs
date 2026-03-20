using Innovation.Domain;
using Innovation.Domain.Enums;

namespace Innovation.Application.Features.Challenges.Shared;

public record ChallengeListResponse(
    int Id,
    string? PublicUlid,
    TranslatableString Title,
    TranslatableString? Description,
    ChallengeStatus Status,
    ChallengeDifficulty? Difficulty,
    DateTime? StartDate,
    DateTime? EndDate,
    bool Featured,
    bool Urgent,
    bool IsPublic,
    int? MaxParticipants,
    DateTime CreatedAt);

public record ChallengeDetailResponse(
    int Id,
    string? PublicUlid,
    TranslatableString Slug,
    TranslatableString Title,
    TranslatableString Description,
    TranslatableString? Organizer,
    TranslatableString? Location,
    ChallengeStatus Status,
    ChallengeDifficulty? Difficulty,
    ChallengeParticipationType? ParticipationType,
    ChallengeSubmissionType? SubmissionType,
    WinnerSelectionMethod? WinnerSelectionMethod,
    int? MaxParticipants,
    int? TeamSizeMin,
    int? TeamSizeMax,
    int? MinEvaluatorsPerIdea,
    string? Language,
    string? ContactEmail,
    string? ContactPhone,
    bool Featured,
    bool Urgent,
    bool IsPublic,
    bool EnableComments,
    bool AutoTransitionEnabled,
    DateTime? StartDate,
    DateTime? EndDate,
    DateTime? SubmissionDeadline,
    DateTime? EvaluationStartDate,
    DateTime? EvaluationEndDate,
    DateTime? WinnersAnnouncedAt,
    int? CategoryId,
    int? InnovationTypeId,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IReadOnlyList<ChallengeAwardResponse> Awards,
    IReadOnlyList<ChallengeObjectiveResponse> Objectives,
    IReadOnlyList<ChallengeRequirementResponse> Requirements,
    IReadOnlyList<ChallengeTimelineResponse> Timeline,
    IReadOnlyList<ChallengeSponsorResponse> Sponsors);

public record ChallengeAwardResponse(int Id, TranslatableString Name, TranslatableString? Description, string? AwardType, decimal? Value, int OrderIndex);
public record ChallengeObjectiveResponse(int Id, TranslatableString Objective, TranslatableString? Description, int OrderIndex);
public record ChallengeRequirementResponse(int Id, TranslatableString Requirement, TranslatableString? Description, string? RequirementType, bool Mandatory, int OrderIndex);
public record ChallengeTimelineResponse(int Id, TranslatableString MilestoneName, TranslatableString? Description, DateTime? MilestoneStartDate, DateTime? MilestoneEndDate, string? Status, int OrderIndex);
public record ChallengeSponsorResponse(int Id, string SponsorName, string? LogoUrl, string? WebsiteUrl, decimal? ContributionAmount, string? SponsorshipType, int OrderIndex);
