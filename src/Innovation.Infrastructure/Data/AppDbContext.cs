using Innovation.Application.Common.Interfaces;
using Innovation.Domain;
using Innovation.Domain.Entities;
using Innovation.Domain.Entities.Challenge;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Innovation.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options, IMediator mediator) : DbContext(options), IAppDbContext
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Lookup> Lookups => Set<Lookup>();
    public DbSet<InnovationType> InnovationTypes => Set<InnovationType>();
    public DbSet<Challenge> Challenges => Set<Challenge>();
    public DbSet<ChallengeAward> ChallengeAwards => Set<ChallengeAward>();
    public DbSet<ChallengeObjective> ChallengeObjectives => Set<ChallengeObjective>();
    public DbSet<ChallengeRequirement> ChallengeRequirements => Set<ChallengeRequirement>();
    public DbSet<ChallengeTimeline> ChallengeTimelines => Set<ChallengeTimeline>();
    public DbSet<ChallengeSponsor> ChallengeSponsors => Set<ChallengeSponsor>();
    public DbSet<ChallengeRisk> ChallengeRisks => Set<ChallengeRisk>();
    public DbSet<ChallengeGroup> ChallengeGroups => Set<ChallengeGroup>();
    public DbSet<ChallengeSustainabilityImpact> ChallengeSustainabilityImpacts => Set<ChallengeSustainabilityImpact>();
    public DbSet<ChallengeIntellectualProperty> ChallengeIntellectualProperties => Set<ChallengeIntellectualProperty>();
    public DbSet<ChallengeUser> ChallengeUsers => Set<ChallengeUser>();

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Dispatch domain events before saving (within the same transaction)
        await mediator.DispatchDomainEventsAsync(this);
        return await base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Apply soft delete query filters for all BaseEntity types
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                modelBuilder.Entity(entityType.ClrType)
                    .HasQueryFilter(CreateSoftDeleteFilter(entityType.ClrType));
            }
        }
    }

    private static System.Linq.Expressions.LambdaExpression CreateSoftDeleteFilter(Type entityType)
    {
        var parameter = System.Linq.Expressions.Expression.Parameter(entityType, "e");
        var deletedAtProperty = System.Linq.Expressions.Expression.Property(parameter, nameof(BaseEntity.DeletedAt));
        var nullConstant = System.Linq.Expressions.Expression.Constant(null, typeof(DateTime?));
        var comparison = System.Linq.Expressions.Expression.Equal(deletedAtProperty, nullConstant);
        return System.Linq.Expressions.Expression.Lambda(comparison, parameter);
    }
}
