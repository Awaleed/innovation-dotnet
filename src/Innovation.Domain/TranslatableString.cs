namespace Innovation.Domain;

/// <summary>
/// Value object for bilingual (English/Arabic) translatable text.
/// Stored as JSON in PostgreSQL via EF Core's ToJson() mapping.
/// </summary>
public class TranslatableString
{
    public string? En { get; set; }
    public string? Ar { get; set; }

    public TranslatableString() { }

    public TranslatableString(string? en, string? ar = null)
    {
        En = en;
        Ar = ar;
    }

    public string? GetTranslation(string locale) =>
        locale switch
        {
            "ar" => Ar ?? En,
            _ => En ?? Ar,
        };

    public override string ToString() => En ?? Ar ?? string.Empty;
}
