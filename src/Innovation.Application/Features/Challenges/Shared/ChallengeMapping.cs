using Innovation.Domain.Entities.Challenge;

namespace Innovation.Application.Features.Challenges.Shared;

public static class ChallengeMapping
{
    public static ChallengeListResponse ToListResponse(this Challenge c) => new(
        c.Id, c.PublicUlid, c.Title, c.Description, c.Status, c.Difficulty,
        c.StartDate, c.EndDate, c.Featured, c.Urgent, c.IsPublic,
        c.MaxParticipants, c.CreatedAt);

    public static ChallengeDetailResponse ToDetailResponse(this Challenge c) => new(
        c.Id, c.PublicUlid, c.Slug, c.Title, c.Description, c.Organizer, c.Location,
        c.Status, c.Difficulty, c.ParticipationType, c.SubmissionType, c.WinnerSelectionMethod,
        c.MaxParticipants, c.TeamSizeMin, c.TeamSizeMax, c.MinEvaluatorsPerIdea,
        c.Language, c.ContactEmail, c.ContactPhone,
        c.Featured, c.Urgent, c.IsPublic, c.EnableComments, c.AutoTransitionEnabled,
        c.StartDate, c.EndDate, c.SubmissionDeadline, c.EvaluationStartDate, c.EvaluationEndDate, c.WinnersAnnouncedAt,
        c.CategoryId, c.InnovationTypeId, c.CreatedAt, c.UpdatedAt,
        c.Awards.Select(a => new ChallengeAwardResponse(a.Id, a.Name, a.Description, a.AwardType, a.Value, a.OrderIndex)).ToList(),
        c.Objectives.Select(o => new ChallengeObjectiveResponse(o.Id, o.Objective, o.Description, o.OrderIndex)).ToList(),
        c.Requirements.Select(r => new ChallengeRequirementResponse(r.Id, r.Requirement, r.Description, r.RequirementType, r.Mandatory, r.OrderIndex)).ToList(),
        c.Timeline.Select(t => new ChallengeTimelineResponse(t.Id, t.MilestoneName, t.Description, t.MilestoneStartDate, t.MilestoneEndDate, t.Status, t.OrderIndex)).ToList(),
        c.Sponsors.Select(s => new ChallengeSponsorResponse(s.Id, s.SponsorName, s.LogoUrl, s.WebsiteUrl, s.ContributionAmount, s.SponsorshipType, s.OrderIndex)).ToList());
}
