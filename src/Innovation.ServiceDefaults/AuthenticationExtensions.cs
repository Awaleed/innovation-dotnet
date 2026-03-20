using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.JsonWebTokens;

namespace Innovation.ServiceDefaults;

public static class AuthenticationExtensions
{
    /// <summary>
    /// Configures JWT Bearer authentication against Keycloak for API services.
    /// Requires "Keycloak" section in configuration with "Url" and "Realm" keys.
    /// </summary>
    public static IServiceCollection AddDefaultAuthentication(this IHostApplicationBuilder builder)
    {
        var services = builder.Services;
        var configuration = builder.Configuration;

        var keycloakSection = configuration.GetSection("Keycloak");

        if (!keycloakSection.Exists())
        {
            return services;
        }

        JsonWebTokenHandler.DefaultInboundClaimTypeMap.Remove("sub");

        var keycloakUrl = keycloakSection.GetRequiredValue("Url");
        var realm = keycloakSection.GetRequiredValue("Realm");
        var authority = $"{keycloakUrl}/realms/{realm}";

        services.AddAuthentication().AddJwtBearer(options =>
        {
            options.Authority = authority;
            options.RequireHttpsMetadata = false;
            options.TokenValidationParameters.ValidateAudience = false;
            options.TokenValidationParameters.ValidIssuers = [authority];
        });

        services.AddAuthorization();

        return services;
    }
}
