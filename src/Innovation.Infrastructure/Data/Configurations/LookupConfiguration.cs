using Innovation.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Innovation.Infrastructure.Data.Configurations;

public class LookupConfiguration : IEntityTypeConfiguration<Lookup>
{
    public void Configure(EntityTypeBuilder<Lookup> builder)
    {
        builder.ToTable("lookups");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Type).HasMaxLength(100).IsRequired();
        builder.OwnsOne(e => e.Name, b => b.ToJson());
        builder.OwnsOne(e => e.Description, b => b.ToJson());
        builder.HasIndex(e => e.Type);
    }
}
