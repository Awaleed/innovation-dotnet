using System.Reflection;
using System.Text.RegularExpressions;
using Innovation.TsGen.Helpers;
using Innovation.TsGen.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;

namespace Innovation.TsGen.Discovery;

public static class ControllerRouteDiscovery
{
    public static List<RouteInfo> Discover()
    {
        var routes = new List<RouteInfo>();
        var assembly = typeof(Innovation.Web.Controllers.HomeController).Assembly;

        var controllerTypes = assembly
            .GetTypes()
            .Where(t =>
                !t.IsAbstract
                && (
                    typeof(Controller).IsAssignableFrom(t)
                    || typeof(ControllerBase).IsAssignableFrom(t)
                )
            )
            .Where(t => t.Namespace?.StartsWith("Innovation.Web") == true);

        foreach (var controller in controllerTypes)
        {
            var controllerRoute = controller.GetCustomAttribute<RouteAttribute>()?.Template ?? "";
            var methods = controller.GetMethods(
                BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly
            );

            foreach (var method in methods)
            {
                if (method.GetCustomAttribute<NonActionAttribute>() != null)
                    continue;

                var httpAttrs = method
                    .GetCustomAttributes()
                    .Where(a => a is IRouteTemplateProvider)
                    .Cast<IRouteTemplateProvider>()
                    .ToList();

                var routeAttr = method.GetCustomAttribute<RouteAttribute>();
                if (httpAttrs.Count == 0 && routeAttr == null)
                    continue;

                string? routeTemplate = null;
                string httpMethod = "get";

                if (httpAttrs.Count > 0)
                {
                    var attr = httpAttrs[0];
                    routeTemplate = attr.Template;
                    httpMethod = attr switch
                    {
                        HttpGetAttribute => "get",
                        HttpPostAttribute => "post",
                        HttpPutAttribute => "put",
                        HttpDeleteAttribute => "delete",
                        HttpPatchAttribute => "patch",
                        _ => "get",
                    };
                }

                routeTemplate ??= routeAttr?.Template;
                if (routeTemplate == null)
                    continue;

                var fullRoute = RouteHelpers.CombineRoutes(controllerRoute, routeTemplate);
                var cleanRoute = Regex.Replace(fullRoute, @"\{(\w+)(:\w+)(\?)?}", "{$1$3}");

                var parameters = Regex
                    .Matches(cleanRoute, @"\{(\w+)\??}")
                    .Select(m => m.Groups[1].Value)
                    .ToList();

                routes.Add(
                    new RouteInfo(
                        "/" + cleanRoute.TrimStart('/'),
                        httpMethod,
                        parameters,
                        controller.Name.Replace("Controller", ""),
                        method.Name
                    )
                );
            }
        }

        return routes;
    }
}
