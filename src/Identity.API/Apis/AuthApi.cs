using System.Security.Claims;
using Innovation.Identity.API.Models;
using Innovation.Identity.API.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Innovation.Identity.API.Apis;

public static class AuthApi
{
    public static IEndpointRouteBuilder MapAuthApi(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("/api/auth");

        api.MapPost("/register", Register)
            .WithName("Register")
            .WithSummary("Register a new user")
            .AllowAnonymous();

        api.MapPost("/login", Login)
            .WithName("Login")
            .WithSummary("Login with email and password")
            .AllowAnonymous();

        api.MapPost("/logout", Logout)
            .WithName("Logout")
            .WithSummary("Logout current user")
            .RequireAuthorization();

        api.MapGet("/me", GetCurrentUser)
            .WithName("GetCurrentUser")
            .WithSummary("Get current authenticated user")
            .RequireAuthorization();

        return app;
    }

    private static async Task<IResult> Register(
        [FromBody] RegisterRequest request,
        UserManager<ApplicationUser> userManager,
        TokenService tokenService)
    {
        if (request.Password != request.ConfirmPassword)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                { "ConfirmPassword", ["Passwords do not match."] }
            });
        }

        var user = new ApplicationUser
        {
            Name = request.Name,
            Email = request.Email,
            UserName = request.Email,
            EmailVerifiedAt = null,
        };

        var result = await userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            var errors = result.Errors
                .GroupBy(e => e.Code)
                .ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray());
            return Results.ValidationProblem(errors);
        }

        var (token, expiresAt) = tokenService.GenerateToken(user);

        return Results.Ok(new AuthResponse(token, expiresAt, new UserInfo(user.Id, user.Name, user.Email!)));
    }

    private static async Task<IResult> Login(
        [FromBody] LoginRequest request,
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        TokenService tokenService)
    {
        var user = await userManager.FindByEmailAsync(request.Email);

        if (user is null)
        {
            return Results.Problem("Invalid email or password.", statusCode: 401);
        }

        var result = await signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: false);

        if (!result.Succeeded)
        {
            return Results.Problem("Invalid email or password.", statusCode: 401);
        }

        var (token, expiresAt) = tokenService.GenerateToken(user);

        return Results.Ok(new AuthResponse(token, expiresAt, new UserInfo(user.Id, user.Name, user.Email!)));
    }

    private static IResult Logout()
    {
        // JWT is stateless — client discards the token.
        return Results.Ok(new { message = "Logged out successfully." });
    }

    private static async Task<IResult> GetCurrentUser(
        ClaimsPrincipal principal,
        UserManager<ApplicationUser> userManager)
    {
        var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? principal.FindFirstValue("sub");

        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var user = await userManager.FindByIdAsync(userId);

        if (user is null)
        {
            return Results.Unauthorized();
        }

        return Results.Ok(new UserInfo(user.Id, user.Name, user.Email!));
    }
}
