using Microsoft.OpenApi;

namespace Innovation.Web.Extensions;

internal static class ServiceCollectionExtensions
{
    internal static IServiceCollection AddSwaggerGenWithAuthSupport(this IServiceCollection services, IConfiguration configuration)
    {
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
                        AuthorizationUrl = new Uri(configuration["Keycloak:AuthorizationUrl"]!),
                        TokenUrl = new Uri(configuration["Keycloak:TokenUrl"]!),
                        Scopes = new Dictionary<string, string>
                        {
                            {"openid" ,"OpenID Connect scope"},
                            {"profile" ,"Profile scope"},

                        }
                    }
                }
            });

            // o.AddSecurityRequirement(doc => new OpenApiSecurityRequirement
            // {
            //     {
            //         new OpenApiSchemaReference("Keycloak", doc),
            //         []
            //     }
            // });
        });

        return services;
    }
}

