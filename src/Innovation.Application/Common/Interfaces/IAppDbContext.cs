using Innovation.Domain.Entities;
using Innovation.Domain.Entities.Challenge;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace Innovation.Application.Common.Interfaces;

public interface IAppDbContext
{
    DatabaseFacade Database { get; }
    DbSet<User> Users { get; }
    DbSet<Lookup> Lookups { get; }
    DbSet<InnovationType> InnovationTypes { get; }
    DbSet<Challenge> Challenges { get; }
    DbSet<ChallengeAward> ChallengeAwards { get; }
    DbSet<ChallengeObjective> ChallengeObjectives { get; }
    DbSet<ChallengeRequirement> ChallengeRequirements { get; }
    DbSet<ChallengeTimeline> ChallengeTimelines { get; }
    DbSet<ChallengeSponsor> ChallengeSponsors { get; }
    DbSet<ChallengeRisk> ChallengeRisks { get; }
    DbSet<ChallengeGroup> ChallengeGroups { get; }
    DbSet<ChallengeSustainabilityImpact> ChallengeSustainabilityImpacts { get; }
    DbSet<ChallengeIntellectualProperty> ChallengeIntellectualProperties { get; }
    DbSet<ChallengeUser> ChallengeUsers { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
