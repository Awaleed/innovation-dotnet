namespace Innovation.Web.Services;

public record KeycloakRegisterResult(
    bool Success,
    Dictionary<string, string[]>? Errors = null);
