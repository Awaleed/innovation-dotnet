using System.Text.Json;
using InertiaCore;
using Innovation.Web.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Innovation.Web.Controllers;

public class AuthController(KeycloakAuthService keycloak) : Controller
{
    // ========== Pages ==========

    [HttpGet("/login")]
    public IActionResult Login()
    {
        if (User.Identity?.IsAuthenticated == true)
            return Redirect("/dashboard");

        return Inertia.Render("Auth/Login", new { canResetPassword = false });
    }

    [HttpGet("/register")]
    public IActionResult Register()
    {
        if (User.Identity?.IsAuthenticated == true)
            return Redirect("/dashboard");

        return Inertia.Render("Auth/Register");
    }

    [Authorize]
    [HttpGet("/dashboard")]
    public IActionResult Dashboard()
    {
        return Inertia.Render("Dashboard");
    }

    // ========== Form Submissions (Inertia POST) ==========

    [HttpPost("/login")]
    public async Task<IActionResult> LoginPost([FromBody] JsonElement body)
    {
        var email = body.GetProperty("email").GetString()!;
        var password = body.GetProperty("password").GetString()!;

        var result = await keycloak.LoginAsync(email, password);

        if (result is null)
        {
            ModelState.AddModelError("email", "Invalid email or password.");
            Inertia.Share("flash", new { success = (string?)null, error = "Invalid email or password." });
            return Inertia.Render("Auth/Login", new { canResetPassword = false });
        }

        // Create cookie session from Keycloak token claims
        var principal = keycloak.ExtractClaims(result);

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            principal,
            new AuthenticationProperties
            {
                IsPersistent = true,
                ExpiresUtc = DateTimeOffset.UtcNow.AddHours(1),
                // Store refresh token for logout
                Items = { ["refresh_token"] = result.RefreshToken },
            });

        return Redirect("/dashboard");
    }

    [HttpPost("/register")]
    public async Task<IActionResult> RegisterPost([FromBody] JsonElement body)
    {
        var name = body.GetProperty("name").GetString()!;
        var email = body.GetProperty("email").GetString()!;
        var password = body.GetProperty("password").GetString()!;

        var registerResult = await keycloak.RegisterAsync(name, email, password);

        if (!registerResult.Success)
        {
            if (registerResult.Errors is not null)
            {
                foreach (var (field, messages) in registerResult.Errors)
                {
                    foreach (var msg in messages)
                        ModelState.AddModelError(field, msg);
                }
            }
            else
            {
                ModelState.AddModelError("email", "Registration failed.");
            }

            Inertia.Share("flash", new { success = (string?)null, error = "Registration failed. Please check the form." });
            return Inertia.Render("Auth/Register");
        }

        // Auto-login after registration
        var loginResult = await keycloak.LoginAsync(email, password);

        if (loginResult is not null)
        {
            var principal = keycloak.ExtractClaims(loginResult);

            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                principal,
                new AuthenticationProperties
                {
                    IsPersistent = true,
                    ExpiresUtc = DateTimeOffset.UtcNow.AddHours(1),
                    Items = { ["refresh_token"] = loginResult.RefreshToken },
                });
        }

        return Redirect("/dashboard");
    }

    [HttpPost("/logout")]
    public async Task<IActionResult> Logout()
    {
        // Revoke refresh token in Keycloak
        var authResult = await HttpContext.AuthenticateAsync();
        string? refreshToken = null;
        authResult.Properties?.Items.TryGetValue("refresh_token", out refreshToken);
        await keycloak.LogoutAsync(refreshToken);

        // Clear local cookie
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return Redirect("/login");
    }
}
