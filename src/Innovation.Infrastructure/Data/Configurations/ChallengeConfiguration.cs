using Innovation.Domain.Entities.Challenge;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Innovation.Infrastructure.Data.Configurations;

public class ChallengeConfiguration : IEntityTypeConfiguration<Challenge>
{
    public void Configure(EntityTypeBuilder<Challenge> builder)
    {
        builder.ToTable("challenges");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.PublicUlid).HasMaxLength(26);
        builder.HasIndex(e => e.PublicUlid).IsUnique().HasFilter("\"PublicUlid\" IS NOT NULL");

        // Translatable JSON fields
        builder.OwnsOne(e => e.Slug, b => b.ToJson());
        builder.OwnsOne(e => e.Title, b => b.ToJson());
        builder.OwnsOne(e => e.Description, b => b.ToJson());
        builder.OwnsOne(e => e.Organizer, b => b.ToJson());
        builder.OwnsOne(e => e.Location, b => b.ToJson());

        // Enums stored as strings
        builder.Property(e => e.Status).HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.Difficulty).HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.ParticipationType).HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.SubmissionType).HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.WinnerSelectionMethod).HasConversion<string>().HasMaxLength(50);

        builder.Property(e => e.ContactEmail).HasMaxLength(255);
        builder.Property(e => e.ContactPhone).HasMaxLength(50);
        builder.Property(e => e.Language).HasMaxLength(10);
        builder.Property(e => e.AutomationSettings).HasColumnType("jsonb");

        // Relationships
        builder.HasOne(e => e.Category)
            .WithMany()
            .HasForeignKey(e => e.CategoryId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.InnovationType)
            .WithMany()
            .HasForeignKey(e => e.InnovationTypeId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(e => e.Awards).WithOne(a => a.Challenge).HasForeignKey(a => a.ChallengeId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(e => e.Objectives).WithOne(o => o.Challenge).HasForeignKey(o => o.ChallengeId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(e => e.Requirements).WithOne(r => r.Challenge).HasForeignKey(r => r.ChallengeId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(e => e.Timeline).WithOne(t => t.Challenge).HasForeignKey(t => t.ChallengeId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(e => e.Sponsors).WithOne(s => s.Challenge).HasForeignKey(s => s.ChallengeId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(e => e.Risks).WithOne(r => r.Challenge).HasForeignKey(r => r.ChallengeId).OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.SustainabilityImpact).WithOne(s => s.Challenge).HasForeignKey<ChallengeSustainabilityImpact>(s => s.ChallengeId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(e => e.IntellectualProperty).WithOne(ip => ip.Challenge).HasForeignKey<ChallengeIntellectualProperty>(ip => ip.ChallengeId).OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(e => e.ChallengeUsers).WithOne(cu => cu.Challenge).HasForeignKey(cu => cu.ChallengeId).OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(e => e.Status);
        builder.HasIndex(e => e.Featured);
    }
}
