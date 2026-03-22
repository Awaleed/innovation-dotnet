using Bogus;
using Innovation.Domain.Entities.Challenge;
using Innovation.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Innovation.Infrastructure.Data.Seeders;

public static class ChallengeSeeder
{
    private const int SeedCount = 1000;

    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        var env = serviceProvider.GetRequiredService<IHostEnvironment>();
        if (!env.IsDevelopment())
            return;

        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AppDbContext>>();

        var existing = await db.Challenges.CountAsync();
        if (existing >= SeedCount)
        {
            logger.LogInformation("Challenges already seeded ({Count} exist), skipping", existing);
            return;
        }

        logger.LogInformation("Seeding {Count} challenges...", SeedCount);

        var faker = new Faker<Challenge>()
            .UseSeed(42)
            .RuleFor(
                c => c.Title,
                f =>
                    new() { En = f.Company.CatchPhrase(), Ar = $"تحدي: {f.Commerce.ProductName()}" }
            )
            .RuleFor(
                c => c.Slug,
                (f, c) =>
                    new()
                    {
                        En = c.Title.En?.ToLower().Replace(" ", "-") ?? f.Lorem.Slug(),
                        Ar = c.Title.Ar?.ToLower().Replace(" ", "-") ?? f.Lorem.Slug(),
                    }
            )
            .RuleFor(
                c => c.Description,
                f => new() { En = f.Lorem.Paragraphs(2), Ar = f.Lorem.Paragraphs(1) }
            )
            .RuleFor(
                c => c.Organizer,
                f => new() { En = f.Company.CompanyName(), Ar = f.Company.CompanyName() }
            )
            .RuleFor(
                c => c.Location,
                f =>
                    new()
                    {
                        En = $"{f.Address.City()}, {f.Address.Country()}",
                        Ar = f.Address.City(),
                    }
            )
            .RuleFor(c => c.Status, f => f.PickRandom<ChallengeStatus>())
            .RuleFor(c => c.Difficulty, f => f.PickRandom<ChallengeDifficulty>())
            .RuleFor(c => c.ParticipationType, f => f.PickRandom<ChallengeParticipationType>())
            .RuleFor(c => c.SubmissionType, f => f.PickRandom<ChallengeSubmissionType>())
            .RuleFor(c => c.Featured, f => f.Random.Bool(0.15f))
            .RuleFor(c => c.Urgent, f => f.Random.Bool(0.08f))
            .RuleFor(c => c.IsPublic, f => f.Random.Bool(0.85f))
            .RuleFor(
                c => c.StartDate,
                f => f.Date.Between(DateTime.UtcNow.AddMonths(-6), DateTime.UtcNow.AddMonths(6))
            )
            .RuleFor(c => c.EndDate, (f, c) => c.StartDate?.AddDays(f.Random.Int(14, 90)))
            .RuleFor(c => c.SubmissionDeadline, (f, c) => c.EndDate?.AddDays(-7))
            .RuleFor(c => c.MaxParticipants, f => f.Random.Int(10, 500))
            .RuleFor(c => c.TeamSizeMin, f => f.Random.Int(1, 3))
            .RuleFor(c => c.TeamSizeMax, (f, c) => c.TeamSizeMin + f.Random.Int(1, 5))
            .RuleFor(c => c.ContactEmail, f => f.Internet.Email())
            .RuleFor(c => c.Language, f => f.PickRandom("en", "ar"))
            .RuleFor(c => c.EnableComments, f => f.Random.Bool(0.7f))
            .RuleFor(c => c.SortOrder, (f, c) => f.IndexFaker);

        var challenges = faker.Generate(SeedCount);

        db.Challenges.AddRange(challenges);
        await db.SaveChangesAsync();

        logger.LogInformation("Seeded {Count} challenges", challenges.Count);
    }
}
