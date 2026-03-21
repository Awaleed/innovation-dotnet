namespace Innovation.Application.Features.Challenges.Models;

public record ChallengeDetailResponse(
    int Id,
    string PublicUlid,
    string Title,
    string? Slug,
    string? Description,
    string Status,
    string? Difficulty,
    string? Organizer,
    string? Location,
    string? StartDate,
    string? EndDate,
    string? SubmissionDeadline,
    string? EvaluationStartDate,
    string? EvaluationEndDate,
    string? WinnersAnnouncedAt,
    string? ParticipationType,
    string? SubmissionType,
    string? WinnerSelectionMethod,
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
    int? CategoryId,
    int? InnovationTypeId,
    List<AwardResponse> Awards,
    List<ObjectiveResponse> Objectives,
    List<RequirementResponse> Requirements,
    List<TimelineResponse> Timeline,
    List<SponsorResponse> Sponsors,
    string CreatedAt,
    string UpdatedAt
);

public record AwardResponse(
    int Id,
    string? Name,
    string? Description,
    string? AwardType,
    decimal? Value,
    int OrderIndex
);

public record ObjectiveResponse(int Id, string? Objective, string? Description, int OrderIndex);

public record RequirementResponse(
    int Id,
    string? Requirement,
    string? Description,
    string? RequirementType,
    bool Mandatory,
    int OrderIndex
);

public record TimelineResponse(
    int Id,
    string? MilestoneName,
    string? Description,
    string? MilestoneStartDate,
    string? MilestoneEndDate,
    string? Status,
    int OrderIndex
);

public record SponsorResponse(
    int Id,
    string SponsorName,
    string? LogoUrl,
    string? WebsiteUrl,
    decimal? ContributionAmount,
    string? SponsorshipType,
    int OrderIndex
);
