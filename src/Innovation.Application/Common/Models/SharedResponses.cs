namespace Innovation.Application.Common.Models;

/// <summary>
/// Reusable sub-response records shared across features.
/// </summary>

// For dropdown/select components
public record SelectOption(int Value, string Label);

// For category references
public record CategoryResponse(int Id, string Name);

// For innovation type references
public record InnovationTypeResponse(int Id, string Name, string? Icon);

// For lookup references
public record LookupResponse(int Id, string Name, string? Description, bool IsActive);

// For media/file references
public record SimpleMediaResponse(int Id, string Url, string? Name, string? MimeType, long Size);
