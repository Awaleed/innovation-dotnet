using Innovation.Application.Common.Models;
using Innovation.Application.Features.Challenges.Models;
using Innovation.Domain.Entities.Challenge;

namespace Innovation.Application.Features.Challenges.Mappings;

public static class ChallengeMappings
{
    public static ChallengeDetailResponse ToDetailResponse(
        this Challenge c,
        string locale = "en"
    ) =>
        new(
            Id: c.Id,
            PublicUlid: c.PublicUlid ?? "",
            Title: c.Title.Get(locale),
            Slug: c.Slug?.GetOrNull(locale),
            Description: c.Description?.GetOrNull(locale),
            Status: c.Status.ToString(),
            Difficulty: c.Difficulty?.ToString(),
            Organizer: c.Organizer?.GetOrNull(locale),
            Location: c.Location?.GetOrNull(locale),
            StartDate: c.StartDate?.ToString("yyyy-MM-dd"),
            EndDate: c.EndDate?.ToString("yyyy-MM-dd"),
            SubmissionDeadline: c.SubmissionDeadline?.ToString("o"),
            EvaluationStartDate: c.EvaluationStartDate?.ToString("o"),
            EvaluationEndDate: c.EvaluationEndDate?.ToString("o"),
            WinnersAnnouncedAt: c.WinnersAnnouncedAt?.ToString("o"),
            ParticipationType: c.ParticipationType?.ToString(),
            SubmissionType: c.SubmissionType?.ToString(),
            WinnerSelectionMethod: c.WinnerSelectionMethod?.ToString(),
            MaxParticipants: c.MaxParticipants,
            TeamSizeMin: c.TeamSizeMin,
            TeamSizeMax: c.TeamSizeMax,
            MinEvaluatorsPerIdea: c.MinEvaluatorsPerIdea,
            Language: c.Language,
            ContactEmail: c.ContactEmail,
            ContactPhone: c.ContactPhone,
            Featured: c.Featured,
            Urgent: c.Urgent,
            IsPublic: c.IsPublic,
            EnableComments: c.EnableComments,
            AutoTransitionEnabled: c.AutoTransitionEnabled,
            CategoryId: c.CategoryId,
            InnovationTypeId: c.InnovationTypeId,
            Awards: c.Awards?.OrderBy(a => a.OrderIndex)
                .Select(a => new AwardResponse(
                    a.Id,
                    a.Name.GetOrNull(locale),
                    a.Description?.GetOrNull(locale),
                    a.AwardType,
                    a.Value,
                    a.OrderIndex
                ))
                .ToList()
                ?? [],
            Objectives: c.Objectives?.OrderBy(o => o.OrderIndex)
                .Select(o => new ObjectiveResponse(
                    o.Id,
                    o.Objective.GetOrNull(locale),
                    o.Description?.GetOrNull(locale),
                    o.OrderIndex
                ))
                .ToList()
                ?? [],
            Requirements: c.Requirements?.OrderBy(r => r.OrderIndex)
                .Select(r => new RequirementResponse(
                    r.Id,
                    r.Requirement.GetOrNull(locale),
                    r.Description?.GetOrNull(locale),
                    r.RequirementType,
                    r.Mandatory,
                    r.OrderIndex
                ))
                .ToList()
                ?? [],
            Timeline: c.Timeline?.OrderBy(t => t.OrderIndex)
                .Select(t => new TimelineResponse(
                    t.Id,
                    t.MilestoneName.GetOrNull(locale),
                    t.Description?.GetOrNull(locale),
                    t.MilestoneStartDate?.ToString("yyyy-MM-dd"),
                    t.MilestoneEndDate?.ToString("yyyy-MM-dd"),
                    t.Status,
                    t.OrderIndex
                ))
                .ToList()
                ?? [],
            Sponsors: c.Sponsors?.OrderBy(s => s.OrderIndex)
                .Select(s => new SponsorResponse(
                    s.Id,
                    s.SponsorName,
                    s.LogoUrl,
                    s.WebsiteUrl,
                    s.ContributionAmount,
                    s.SponsorshipType,
                    s.OrderIndex
                ))
                .ToList()
                ?? [],
            CreatedAt: c.CreatedAt.ToString("o"),
            UpdatedAt: c.UpdatedAt.ToString("o")
        );

    public static ChallengeEditResponse ToEditResponse(this Challenge c) =>
        new(
            Id: c.Id,
            Title: c.Title.ToField(),
            Slug: c.Slug?.ToFieldOrNull(),
            Description: c.Description?.ToFieldOrNull(),
            Organizer: c.Organizer?.ToFieldOrNull(),
            Location: c.Location?.ToFieldOrNull(),
            Status: c.Status.ToString(),
            CategoryId: c.CategoryId,
            InnovationTypeId: c.InnovationTypeId,
            Difficulty: c.Difficulty?.ToString(),
            ParticipationType: c.ParticipationType?.ToString(),
            SubmissionType: c.SubmissionType?.ToString(),
            WinnerSelectionMethod: c.WinnerSelectionMethod?.ToString(),
            MaxParticipants: c.MaxParticipants,
            TeamSizeMin: c.TeamSizeMin,
            TeamSizeMax: c.TeamSizeMax,
            MinEvaluatorsPerIdea: c.MinEvaluatorsPerIdea,
            Language: c.Language,
            ContactEmail: c.ContactEmail,
            ContactPhone: c.ContactPhone,
            Featured: c.Featured,
            Urgent: c.Urgent,
            IsPublic: c.IsPublic,
            EnableComments: c.EnableComments,
            AutoTransitionEnabled: c.AutoTransitionEnabled,
            StartDate: c.StartDate?.ToString("yyyy-MM-dd"),
            EndDate: c.EndDate?.ToString("yyyy-MM-dd"),
            SubmissionDeadline: c.SubmissionDeadline?.ToString("o"),
            EvaluationStartDate: c.EvaluationStartDate?.ToString("o"),
            EvaluationEndDate: c.EvaluationEndDate?.ToString("o")
        );
}
