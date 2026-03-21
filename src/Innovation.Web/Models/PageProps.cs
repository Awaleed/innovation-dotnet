namespace Innovation.Web.Models;

/// <summary>
/// User info shared with every Inertia page via HandleInertiaRequests middleware.
/// Exported to TypeScript by Reinforced.Typings (see Typings/ReinforcedTypingsConfiguration.cs).
/// </summary>
public record AuthUser(string Id, string Name, string Email);

/// <summary>
/// Shared auth props available on every page.
/// </summary>
public record AuthProps(AuthUser? User);

/// <summary>
/// Shared props passed to every Inertia page.
/// </summary>
public record SharedProps(AuthProps Auth);
