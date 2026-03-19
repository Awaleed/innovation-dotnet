using InertiaCore;
using Microsoft.AspNetCore.Mvc;

namespace Innovation.Web.Controllers;

public class HomeController : Controller
{
    [Route("/")]
    public IActionResult Index()
    {
        return Inertia.Render("Welcome");
    }
}
