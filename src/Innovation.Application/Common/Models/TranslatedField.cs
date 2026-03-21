using Innovation.Domain;

namespace Innovation.Application.Common.Models;

/// <summary>
/// Exposes both locale values for edit forms.
/// Used in EditResponse records where the frontend needs to show both languages.
/// </summary>
public record TranslatedField(string? En, string? Ar);

public static class TranslatableStringExtensions
{
    /// <summary>
    /// Gets the localized value with fallback: requested locale → other locale → empty.
    /// </summary>
    public static string Get(this TranslatableString ts, string locale) =>
        locale == "ar" ? (ts.Ar ?? ts.En ?? "") : (ts.En ?? ts.Ar ?? "");

    /// <summary>
    /// Gets the localized value, returning null if both are null.
    /// </summary>
    public static string? GetOrNull(this TranslatableString? ts, string locale) =>
        ts is null ? null
        : locale == "ar" ? (ts.Ar ?? ts.En)
        : (ts.En ?? ts.Ar);

    /// <summary>
    /// Converts to TranslatedField for edit responses.
    /// </summary>
    public static TranslatedField ToField(this TranslatableString ts) => new(ts.En, ts.Ar);

    /// <summary>
    /// Converts nullable TranslatableString to nullable TranslatedField.
    /// </summary>
    public static TranslatedField? ToFieldOrNull(this TranslatableString? ts) =>
        ts is null ? null : new(ts.En, ts.Ar);
}
