using InertiaCore;
using Microsoft.AspNetCore.Mvc;

namespace Innovation.Web.Controllers;

public class HomeController : Controller
{
    [Route("/", Name = "home")]
    [HttpGet]
    public IActionResult Home()
    {
        if (User.Identity?.IsAuthenticated == true)
        {
            return Redirect("/dashboard");
        }

        return Inertia.Render("Welcome");
    }
}
