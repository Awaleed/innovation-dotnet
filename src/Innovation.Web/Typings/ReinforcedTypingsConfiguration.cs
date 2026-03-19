using Innovation.Shared;
using Innovation.Shared.Enums;
using Innovation.Web.Models;
using Reinforced.Typings.Fluent;

namespace Innovation.Web.Typings;

public static class ReinforcedTypingsConfiguration
{
    public static void Configure(Reinforced.Typings.Fluent.ConfigurationBuilder builder)
    {
        builder.Global(config => config
            .UseModules()
            .CamelCaseForProperties()
            .AutoOptionalProperties()
            .GenerateDocumentation()
        );

        // Shared types
        builder.ExportAsInterface<TranslatableString>()
            .WithPublicProperties();

        // Auth & page prop types
        builder.ExportAsInterface<AuthUser>()
            .WithPublicProperties();

        builder.ExportAsInterface<AuthProps>()
            .WithPublicProperties();

        builder.ExportAsInterface<SharedProps>()
            .WithPublicProperties();

        // Enums
        builder.ExportAsEnum<ChallengeStatus>();
    }
}
