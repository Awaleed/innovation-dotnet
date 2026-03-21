namespace Innovation.Application.Features.Challenges.Models;

public record ChallengeListResponse(
    int Id,
    string PublicUlid,
    string Title,
    string? Slug,
    string Status,
    string? Difficulty,
    string? Organizer,
    string? StartDate,
    string? EndDate,
    bool Featured,
    bool Urgent,
    bool IsPublic,
    int? MaxParticipants,
    string CreatedAt
);
