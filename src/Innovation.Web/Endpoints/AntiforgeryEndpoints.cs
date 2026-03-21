using Microsoft.AspNetCore.Antiforgery;

namespace Innovation.Web.Endpoints;

public static class AntiforgeryEndpoints
{
    public static void MapAntiforgeryEndpoints(this WebApplication app)
    {
        app.MapGet(
                "/antiforgery/token",
                (IAntiforgery antiforgery, HttpContext context) =>
                {
                    var tokens = antiforgery.GetAndStoreTokens(context);
                    return Results.Ok(new { token = tokens.RequestToken });
                }
            )
            .RequireAuthorization();
    }
}
