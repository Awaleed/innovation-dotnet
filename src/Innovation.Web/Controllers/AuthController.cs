using InertiaCore;
using Microsoft.AspNetCore.Mvc;

namespace Innovation.Web.Controllers;

public class AuthController : Controller
{
    [Route("/login")]
    public IActionResult Login()
    {
        return Inertia.Render("Auth/Login");
    }

    [Route("/register")]
    public IActionResult Register()
    {
        return Inertia.Render("Auth/Register");
    }

    [Route("/dashboard")]
    public IActionResult Dashboard()
    {
        // Try to get user from the JWT token stored in localStorage
        // For now, pass user info via query params or let the frontend handle it
        return Inertia.Render("Dashboard");
    }
}
