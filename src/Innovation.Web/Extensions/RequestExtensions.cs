namespace Innovation.Web.Extensions;

public static class RequestExtensions
{
    public static bool ExpectsJson(this HttpRequest request)
    {
        return request.Headers.Accept.Any(h =>
            h != null && h.Contains("application/json", StringComparison.OrdinalIgnoreCase)
        );
    }
}
