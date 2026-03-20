using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using InertiaCore;

namespace Innovation.Web.Controllers;

public class AuthController : Controller
{
    [HttpGet("/login")]
    public IActionResult Login(string? returnUrl = "/dashboard")
    {
        if (User.Identity?.IsAuthenticated == true)
            return Redirect("/dashboard");

        return Challenge(
            new AuthenticationProperties { RedirectUri = returnUrl },
            "keycloak-oidc");
    }

    [HttpGet("/register")]
    public IActionResult Register()
    {
        if (User.Identity?.IsAuthenticated == true)
            return Redirect("/dashboard");

        // Keycloak's login page shows a "Register" link when registrationAllowed=true
        return Challenge(
            new AuthenticationProperties { RedirectUri = "/dashboard" },
            "keycloak-oidc");
    }

    [Authorize]
    [HttpGet("/dashboard")]
    public IActionResult Dashboard()
    {
        return Inertia.Render("Dashboard");
    }

    [HttpPost("/logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return SignOut(
            new AuthenticationProperties { RedirectUri = "/" },
            "keycloak-oidc");
    }
}
