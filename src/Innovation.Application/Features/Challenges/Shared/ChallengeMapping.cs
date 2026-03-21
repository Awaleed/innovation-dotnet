using Innovation.Application.Common.Models;
using Innovation.Domain;
using Innovation.Domain.Entities.Challenge;

namespace Innovation.Application.Features.Challenges.Shared;

public static class ChallengeMapping
{
    private const string DefaultLocale = "en";

    /// <summary>
    /// Builds the meta.translations dictionary for translatable fields.
    /// </summary>
    private static Dictionary<string, object?> BuildTranslationsMeta(Challenge c) => new()
    {
        ["translations"] = new Dictionary<string, object?>
        {
            ["slug"] = new { en = c.Slug.En, ar = c.Slug.Ar },
            ["title"] = new { en = c.Title.En, ar = c.Title.Ar },
            ["description"] = new { en = c.Description.En, ar = c.Description.Ar },
            ["organizer"] = new { en = c.Organizer?.En, ar = c.Organizer?.Ar },
            ["location"] = new { en = c.Location?.En, ar = c.Location?.Ar },
        }
    };

    private static string? Localize(TranslatableString? ts, string locale = DefaultLocale)
        => ts?.GetTranslation(locale);

    private static string? FormatDate(DateTime? dt) => dt?.ToString("o");

    public static ApiResource<ChallengeListAttributes> ToListResource(this Challenge c, string locale = DefaultLocale)
    {
        var attributes = new ChallengeListAttributes(
            Slug: Localize(c.Slug, locale),
            Title: Localize(c.Title, locale),
            Description: Localize(c.Description, locale),
            Organizer: Localize(c.Organizer, locale),
            Status: c.Status,
            Difficulty: c.Difficulty,
            StartDate: c.StartDate?.ToString("yyyy-MM-dd"),
            EndDate: c.EndDate?.ToString("yyyy-MM-dd"),
            Featured: c.Featured,
            Urgent: c.Urgent,
            IsPublic: c.IsPublic,
            PublicUlid: c.PublicUlid,
            MaxParticipants: c.MaxParticipants,
            Timestamps: new ChallengeTimestamps(FormatDate(c.CreatedAt), FormatDate(c.UpdatedAt)));

        return new ApiResource<ChallengeListAttributes>(
            Id: c.Id,
            Type: "challenge",
            Attributes: attributes,
            Meta: BuildTranslationsMeta(c));
    }

    public static ApiResource<ChallengeDetailAttributes> ToDetailResource(this Challenge c, string locale = DefaultLocale)
    {
        var attributes = new ChallengeDetailAttributes(
            Slug: Localize(c.Slug, locale),
            Title: Localize(c.Title, locale),
            Description: Localize(c.Description, locale),
            Organizer: Localize(c.Organizer, locale),
            Location: Localize(c.Location, locale),
            Status: c.Status,
            Difficulty: c.Difficulty,
            ParticipationType: c.ParticipationType,
            SubmissionType: c.SubmissionType,
            WinnerSelectionMethod: c.WinnerSelectionMethod,
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
            PublicUlid: c.PublicUlid,
            StartDate: c.StartDate?.ToString("yyyy-MM-dd"),
            EndDate: c.EndDate?.ToString("yyyy-MM-dd"),
            SubmissionDeadline: FormatDate(c.SubmissionDeadline),
            EvaluationStartDate: FormatDate(c.EvaluationStartDate),
            EvaluationEndDate: FormatDate(c.EvaluationEndDate),
            WinnersAnnouncedAt: FormatDate(c.WinnersAnnouncedAt),
            CategoryId: c.CategoryId,
            InnovationTypeId: c.InnovationTypeId,
            Timestamps: new ChallengeTimestamps(FormatDate(c.CreatedAt), FormatDate(c.UpdatedAt)));

        var relationships = new Dictionary<string, object?>
        {
            ["awards"] = c.Awards.Select(a => new ChallengeAwardResponse(
                a.Id, Localize(a.Name, locale), Localize(a.Description, locale),
                a.AwardType, a.Value, a.OrderIndex)).ToList(),
            ["objectives"] = c.Objectives.Select(o => new ChallengeObjectiveResponse(
                o.Id, Localize(o.Objective, locale), Localize(o.Description, locale),
                o.OrderIndex)).ToList(),
            ["requirements"] = c.Requirements.Select(r => new ChallengeRequirementResponse(
                r.Id, Localize(r.Requirement, locale), Localize(r.Description, locale),
                r.RequirementType, r.Mandatory, r.OrderIndex)).ToList(),
            ["timeline"] = c.Timeline.Select(t => new ChallengeTimelineResponse(
                t.Id, Localize(t.MilestoneName, locale), Localize(t.Description, locale),
                t.MilestoneStartDate?.ToString("yyyy-MM-dd"), t.MilestoneEndDate?.ToString("yyyy-MM-dd"),
                t.Status, t.OrderIndex)).ToList(),
            ["sponsors"] = c.Sponsors.Select(s => new ChallengeSponsorResponse(
                s.Id, s.SponsorName, s.LogoUrl, s.WebsiteUrl,
                s.ContributionAmount, s.SponsorshipType, s.OrderIndex)).ToList(),
        };

        return new ApiResource<ChallengeDetailAttributes>(
            Id: c.Id,
            Type: "challenge",
            Attributes: attributes,
            Meta: BuildTranslationsMeta(c),
            Relationships: relationships);
    }
}
