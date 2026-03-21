namespace Innovation.Web.Extensions;

internal static class ServiceCollectionExtensions
{
    internal static IServiceCollection AddOpenApiWithAuth(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOpenApi(options =>
        {
            options.AddDocumentTransformer((document, context, ct) =>
            {
                document.Info.Title = "Innovation Platform API";
                document.Info.Version = "v1";
                return Task.CompletedTask;
            });
        });

        return services;
    }
}
