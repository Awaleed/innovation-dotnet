using System.Text.RegularExpressions;
using Innovation.TsGen.Helpers;
using Innovation.TsGen.Models;

namespace Innovation.TsGen.Discovery;

public static class EndpointRouteDiscovery
{
    public static List<RouteInfo> Discover(string endpointsDir)
    {
        var routes = new List<RouteInfo>();

        if (!Directory.Exists(endpointsDir))
            return routes;

        foreach (var file in Directory.GetFiles(endpointsDir, "*Endpoints.cs"))
        {
            var source = File.ReadAllText(file);
            var controllerName = Path.GetFileNameWithoutExtension(file).Replace("Endpoints", "");
            routes.AddRange(ParseEndpointFile(source, controllerName));
        }

        return routes;
    }

    private static List<RouteInfo> ParseEndpointFile(string source, string controllerName)
    {
        var routes = new List<RouteInfo>();

        string groupPrefix = "";
        var groupMatch = Regex.Match(source, @"MapGroup\(\s*""([^""]+)""\s*\)");
        if (groupMatch.Success)
            groupPrefix = groupMatch.Groups[1].Value.TrimEnd('/');

        var mapPattern = new Regex(
            @"(?:group|app)\s*\.\s*Map(Get|Post|Put|Delete|Patch)\s*\(\s*""([^""]+)""",
            RegexOptions.Multiline
        );

        foreach (Match match in mapPattern.Matches(source))
        {
            var httpMethod = match.Groups[1].Value.ToLowerInvariant();
            var routeTemplate = match.Groups[2].Value;

            string fullRoute;
            if (match.Value.StartsWith("app"))
            {
                fullRoute = "/" + routeTemplate.TrimStart('/');
            }
            else
            {
                fullRoute = groupPrefix + "/" + routeTemplate.TrimStart('/');
                fullRoute = "/" + fullRoute.TrimStart('/');
            }

            fullRoute = Regex.Replace(fullRoute, @"//+", "/");
            if (fullRoute.Length > 1)
                fullRoute = fullRoute.TrimEnd('/');

            var cleanRoute = Regex.Replace(fullRoute, @"\{(\w+)(:\w+)(\?)?}", "{$1$3}");

            var parameters = Regex
                .Matches(cleanRoute, @"\{(\w+)\??}")
                .Select(m => m.Groups[1].Value)
                .ToList();

            var actionName = DeriveActionName(httpMethod, routeTemplate);

            routes.Add(
                new RouteInfo(cleanRoute, httpMethod, parameters, controllerName, actionName)
            );
        }

        return routes;
    }

    private static string DeriveActionName(string method, string routeTemplate)
    {
        var route = routeTemplate.Trim('/');

        var segments = route
            .Split('/', StringSplitOptions.RemoveEmptyEntries)
            .Where(s => !s.StartsWith('{'))
            .ToList();

        if (segments.Count > 0)
            return RouteHelpers.ToCamelCase(segments.Last());

        return method switch
        {
            "get" when !route.Contains('{') => "list",
            "get" => "get",
            "post" => "create",
            "put" => "update",
            "delete" => "remove",
            "patch" => "patch",
            _ => method,
        };
    }
}
