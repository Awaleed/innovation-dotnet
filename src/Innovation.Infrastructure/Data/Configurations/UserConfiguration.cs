using Innovation.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Innovation.Infrastructure.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Name).HasMaxLength(255).IsRequired();
        builder.Property(e => e.Email).HasMaxLength(255).IsRequired();
        builder.HasIndex(e => e.Email).IsUnique();
    }
}
