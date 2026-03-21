using Innovation.Domain;
using Innovation.Domain.Enums;

namespace Innovation.Application.Features.Challenges.Shared;

// --- List attributes (subset for index pages) ---
public record ChallengeListAttributes(
    string? Slug,
    string? Title,
    string? Description,
    string? Organizer,
    ChallengeStatus Status,
    ChallengeDifficulty? Difficulty,
    string? StartDate,
    string? EndDate,
    bool Featured,
    bool Urgent,
    bool IsPublic,
    string? PublicUlid,
    int? MaxParticipants,
    ChallengeTimestamps Timestamps);

// --- Detail attributes (full entity for show/edit pages) ---
public record ChallengeDetailAttributes(
    string? Slug,
    string? Title,
    string? Description,
    string? Organizer,
    string? Location,
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
    string? PublicUlid,
    string? StartDate,
    string? EndDate,
    string? SubmissionDeadline,
    string? EvaluationStartDate,
    string? EvaluationEndDate,
    string? WinnersAnnouncedAt,
    int? CategoryId,
    int? InnovationTypeId,
    ChallengeTimestamps Timestamps);

// --- Shared sub-records ---
public record ChallengeTimestamps(string? Created, string? Updated);

// --- Relationship DTOs ---
public record ChallengeAwardResponse(int Id, string? Name, string? Description, string? AwardType, decimal? Value, int OrderIndex);
public record ChallengeObjectiveResponse(int Id, string? Objective, string? Description, int OrderIndex);
public record ChallengeRequirementResponse(int Id, string? Requirement, string? Description, string? RequirementType, bool Mandatory, int OrderIndex);
public record ChallengeTimelineResponse(int Id, string? MilestoneName, string? Description, string? MilestoneStartDate, string? MilestoneEndDate, string? Status, int OrderIndex);
public record ChallengeSponsorResponse(int Id, string SponsorName, string? LogoUrl, string? WebsiteUrl, decimal? ContributionAmount, string? SponsorshipType, int OrderIndex);
