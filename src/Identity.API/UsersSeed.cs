using Innovation.Identity.API.Data;
using Innovation.Identity.API.Models;
using Microsoft.AspNetCore.Identity;

namespace Innovation.Identity.API;

public class UsersSeed(
    ILogger<UsersSeed> logger,
    UserManager<ApplicationUser> userManager) : IDbSeeder<ApplicationDbContext>
{
    public async Task SeedAsync(ApplicationDbContext context)
    {
        // Super Admin — matches Laravel's User::SUPER_ADMIN_EMAIL
        await EnsureUser(
            name: "Super Admin",
            email: "admin@alinmabank.test",
            password: "Admin@123!");

        // Demo user
        await EnsureUser(
            name: "Demo User",
            email: "demo@innovation.test",
            password: "Demo@123!");
    }

    private async Task EnsureUser(string name, string email, string password)
    {
        var existing = await userManager.FindByEmailAsync(email);

        if (existing is not null)
        {
            logger.LogDebug("User {Email} already exists, skipping", email);
            return;
        }

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid().ToString(),
            Name = name,
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            EmailVerifiedAt = DateTime.UtcNow,
        };

        var result = await userManager.CreateAsync(user, password);

        if (!result.Succeeded)
        {
            throw new Exception($"Failed to create user {email}: {result.Errors.First().Description}");
        }

        logger.LogInformation("Seeded user: {Email}", email);
    }
}
