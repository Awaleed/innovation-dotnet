using InertiaCore;
using Microsoft.AspNetCore.Mvc;

namespace Innovation.Web.Controllers;

public class HomeController : Controller
{
    [Route("/")]
    public IActionResult Index()
    {
        if (User.Identity?.IsAuthenticated == true)
        {
            return Redirect("/dashboard");
        }

        return Inertia.Render("Welcome");
    }
}
