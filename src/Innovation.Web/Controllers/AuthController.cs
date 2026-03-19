using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using InertiaCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Innovation.Web.Controllers;

public class AuthController : Controller
{
    [Route("/login")]
    public IActionResult Login()
    {
        if (User.Identity?.IsAuthenticated == true)
        {
            return Redirect("/dashboard");
        }

        return Inertia.Render("Auth/Login");
    }

    [Route("/register")]
    public IActionResult Register()
    {
        if (User.Identity?.IsAuthenticated == true)
        {
            return Redirect("/dashboard");
        }

        return Inertia.Render("Auth/Register");
    }

    [Authorize]
    [Route("/dashboard")]
    public IActionResult Dashboard()
    {
        return Inertia.Render("Dashboard");
    }
}
