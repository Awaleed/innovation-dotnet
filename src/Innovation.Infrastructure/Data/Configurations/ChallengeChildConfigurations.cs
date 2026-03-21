using Innovation.Domain.Entities.Challenge;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Innovation.Infrastructure.Data.Configurations;

public class ChallengeAwardConfiguration : IEntityTypeConfiguration<ChallengeAward>
{
    public void Configure(EntityTypeBuilder<ChallengeAward> builder)
    {
        builder.ToTable("challenge_awards");
        builder.OwnsOne(e => e.Name, b => b.ToJson());
        builder.OwnsOne(e => e.Description, b => b.ToJson());
        builder.Property(e => e.Value).HasPrecision(12, 2);
    }
}

public class ChallengeObjectiveConfiguration : IEntityTypeConfiguration<ChallengeObjective>
{
    public void Configure(EntityTypeBuilder<ChallengeObjective> builder)
    {
        builder.ToTable("challenge_objectives");
        builder.OwnsOne(e => e.Objective, b => b.ToJson());
        builder.OwnsOne(e => e.Description, b => b.ToJson());
        builder.OwnsOne(e => e.ExpectedOutcome, b => b.ToJson());
        builder.Property(e => e.Metrics).HasColumnType("jsonb");
    }
}

public class ChallengeRequirementConfiguration : IEntityTypeConfiguration<ChallengeRequirement>
{
    public void Configure(EntityTypeBuilder<ChallengeRequirement> builder)
    {
        builder.ToTable("challenge_requirements");
        builder.OwnsOne(e => e.Requirement, b => b.ToJson());
        builder.OwnsOne(e => e.Description, b => b.ToJson());
    }
}

public class ChallengeTimelineConfiguration : IEntityTypeConfiguration<ChallengeTimeline>
{
    public void Configure(EntityTypeBuilder<ChallengeTimeline> builder)
    {
        builder.ToTable("challenge_timelines");
        builder.OwnsOne(e => e.MilestoneName, b => b.ToJson());
        builder.OwnsOne(e => e.Description, b => b.ToJson());
        builder.Property(e => e.Deliverables).HasColumnType("jsonb");
    }
}

public class ChallengeSponsorConfiguration : IEntityTypeConfiguration<ChallengeSponsor>
{
    public void Configure(EntityTypeBuilder<ChallengeSponsor> builder)
    {
        builder.ToTable("challenge_sponsors");
        builder.Property(e => e.SponsorName).HasMaxLength(255).IsRequired();
        builder.Property(e => e.ContributionAmount).HasPrecision(12, 2);
    }
}

public class ChallengeRiskConfiguration : IEntityTypeConfiguration<ChallengeRisk>
{
    public void Configure(EntityTypeBuilder<ChallengeRisk> builder)
    {
        builder.ToTable("challenge_risks");
        builder.OwnsOne(e => e.RiskName, b => b.ToJson());
        builder.OwnsOne(e => e.Description, b => b.ToJson());
        builder.OwnsOne(e => e.MitigationStrategy, b => b.ToJson());
        builder
            .HasOne(e => e.Owner)
            .WithMany()
            .HasForeignKey(e => e.OwnerId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class ChallengeGroupConfiguration : IEntityTypeConfiguration<ChallengeGroup>
{
    public void Configure(EntityTypeBuilder<ChallengeGroup> builder)
    {
        builder.ToTable("challenge_groups");
        builder.Property(e => e.Name).HasMaxLength(255).IsRequired();
    }
}

public class ChallengeSustainabilityImpactConfiguration
    : IEntityTypeConfiguration<ChallengeSustainabilityImpact>
{
    public void Configure(EntityTypeBuilder<ChallengeSustainabilityImpact> builder)
    {
        builder.ToTable("challenge_sustainability_impacts");
        builder.OwnsOne(e => e.ImpactArea, b => b.ToJson());
        builder.OwnsOne(e => e.Description, b => b.ToJson());
        builder.Property(e => e.SdgAlignment).HasColumnType("jsonb");
        builder.Property(e => e.QuantifiableMetrics).HasColumnType("jsonb");
    }
}

public class ChallengeIntellectualPropertyConfiguration
    : IEntityTypeConfiguration<ChallengeIntellectualProperty>
{
    public void Configure(EntityTypeBuilder<ChallengeIntellectualProperty> builder)
    {
        builder.ToTable("challenge_intellectual_properties");
        builder.Property(e => e.ProtectionMechanism).HasColumnType("jsonb");
    }
}

public class ChallengeUserConfiguration : IEntityTypeConfiguration<ChallengeUser>
{
    public void Configure(EntityTypeBuilder<ChallengeUser> builder)
    {
        builder.ToTable("challenge_users");
        builder.HasKey(e => new
        {
            e.ChallengeId,
            e.UserId,
            e.Role,
        });
        builder.Property(e => e.Role).HasMaxLength(50).IsRequired();
        builder
            .HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
