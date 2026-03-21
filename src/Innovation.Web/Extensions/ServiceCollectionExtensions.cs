using Microsoft.OpenApi;

namespace Innovation.Web.Extensions;

internal static class ServiceCollectionExtensions
{
    internal static IServiceCollection AddSwaggerGenWithAuthSupport(this IServiceCollection services, IConfiguration configuration)
    {
        var keycloakBase = configuration["Keycloak:auth-server-url"] ?? "http://localhost:8080";
        var realm = configuration["Keycloak:realm"] ?? "innovation";
        var oidcBase = $"{keycloakBase}/realms/{realm}/protocol/openid-connect";

        services.AddSwaggerGen(o =>
        {
            o.CustomSchemaIds(id => id.FullName!.Replace('+', '-'));

            o.AddSecurityDefinition("Keycloak", new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.OAuth2,
                Flows = new OpenApiOAuthFlows
                {
                    AuthorizationCode = new OpenApiOAuthFlow
                    {
                        AuthorizationUrl = new Uri($"{oidcBase}/auth"),
                        TokenUrl = new Uri($"{oidcBase}/token"),
                        Scopes = new Dictionary<string, string>
                        {
                            {"openid" ,"OpenID Connect scope"},
                            {"profile" ,"Profile scope"},

                        }
                    }
                }
            });

            o.AddSecurityRequirement(doc => new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecuritySchemeReference("Keycloak", doc),
                    []
                }
            });
        });

        return services;
    }
}

