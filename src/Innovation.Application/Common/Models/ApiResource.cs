using System.Text.Json.Serialization;

namespace Innovation.Application.Common.Models;

/// <summary>
/// Generic API resource wrapper matching PHP's JSON:API-like format:
/// { id, type, attributes, meta, relationships }
/// </summary>
public record ApiResource<TAttributes>(
    int Id,
    string Type,
    TAttributes Attributes,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    object? Media = null,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    Dictionary<string, object?>? Meta = null,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    Dictionary<string, object?>? Relationships = null
);

/// <summary>
/// Helper to build ApiResource instances with fluent meta/relationships.
/// </summary>
public static class ApiResourceBuilder
{
    public static ApiResource<TAttributes> ToApiResource<TAttributes>(
        int id,
        string type,
        TAttributes attributes,
        object? media = null,
        Dictionary<string, object?>? meta = null,
        Dictionary<string, object?>? relationships = null)
    {
        return new ApiResource<TAttributes>(id, type, attributes, media, meta, relationships);
    }
}
