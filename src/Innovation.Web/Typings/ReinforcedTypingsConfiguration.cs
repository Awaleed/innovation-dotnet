using Innovation.Application.Common.Models;
using Innovation.Application.Features.Challenges.Models;
using Innovation.Domain;
using Innovation.Domain.Enums;
using Innovation.Web.Models;
using Reinforced.Typings.Fluent;

namespace Innovation.Web.Typings;

public static class ReinforcedTypingsConfiguration
{
    public static void Configure(Reinforced.Typings.Fluent.ConfigurationBuilder builder)
    {
        builder.Global(config =>
            config
                .UseModules()
                .CamelCaseForProperties()
                .AutoOptionalProperties()
                .GenerateDocumentation()
        );

        // ── Domain value objects ──
        builder.ExportAsInterface<TranslatableString>().WithPublicProperties();

        // ── Auth & page prop types ──
        builder.ExportAsInterface<AuthUser>().WithPublicProperties();
        builder.ExportAsInterface<AuthProps>().WithPublicProperties();
        builder.ExportAsInterface<SharedProps>().WithPublicProperties();

        // ── Domain enums ──
        builder.ExportAsEnum<ChallengeStatus>();
        builder.ExportAsEnum<ChallengeDifficulty>();
        builder.ExportAsEnum<ChallengeParticipationType>();
        builder.ExportAsEnum<ChallengeSubmissionType>();
        builder.ExportAsEnum<WinnerSelectionMethod>();

        // ── Common shared responses ──
        builder.ExportAsInterface<TranslatedField>().WithPublicProperties();
        builder.ExportAsInterface<SelectOption>().WithPublicProperties();
        builder.ExportAsInterface<CategoryResponse>().WithPublicProperties();
        builder.ExportAsInterface<InnovationTypeResponse>().WithPublicProperties();
        builder.ExportAsInterface<LookupResponse>().WithPublicProperties();
        builder.ExportAsInterface<SimpleMediaResponse>().WithPublicProperties();

        // ── Challenge responses ──
        builder.ExportAsInterface<ChallengeListResponse>().WithPublicProperties();
        builder.ExportAsInterface<ChallengeDetailResponse>().WithPublicProperties();
        builder.ExportAsInterface<ChallengeEditResponse>().WithPublicProperties();

        // ── Challenge sub-responses ──
        builder.ExportAsInterface<AwardResponse>().WithPublicProperties();
        builder.ExportAsInterface<ObjectiveResponse>().WithPublicProperties();
        builder.ExportAsInterface<RequirementResponse>().WithPublicProperties();
        builder.ExportAsInterface<TimelineResponse>().WithPublicProperties();
        builder.ExportAsInterface<SponsorResponse>().WithPublicProperties();
    }
}
