namespace Innovation.Domain.Entities;

public class Lookup : BaseEntity
{
    public string Type { get; set; } = string.Empty;
    public TranslatableString Name { get; set; } = new();
    public TranslatableString? Description { get; set; }
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public int OrderIndex { get; set; }
    public bool IsActive { get; set; } = true;
}
