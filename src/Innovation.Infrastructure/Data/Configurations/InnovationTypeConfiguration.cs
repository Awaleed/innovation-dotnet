using Innovation.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Innovation.Infrastructure.Data.Configurations;

public class InnovationTypeConfiguration : IEntityTypeConfiguration<InnovationType>
{
    public void Configure(EntityTypeBuilder<InnovationType> builder)
    {
        builder.ToTable("innovation_types");
        builder.HasKey(e => e.Id);
        builder.OwnsOne(e => e.Name, b => b.ToJson());
        builder.OwnsOne(e => e.Description, b => b.ToJson());
    }
}
