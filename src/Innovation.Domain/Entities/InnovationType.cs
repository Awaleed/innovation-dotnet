namespace Innovation.Domain.Entities;

public class InnovationType : BaseEntity
{
    public TranslatableString Name { get; set; } = new();
    public TranslatableString? Description { get; set; }
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public int OrderIndex { get; set; }
}
