namespace Innovation.Domain.Enums;

/// <summary>
/// Maps to Laravel's ChallengeStatus enum.
/// </summary>
public enum ChallengeStatus
{
    Draft,
    Upcoming,
    Open,
    Closed,
    Judging,
    Voting,
    Completed,
    Cancelled
}
