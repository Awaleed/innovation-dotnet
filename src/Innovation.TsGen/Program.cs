using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;

namespace Innovation.TsGen;

/// <summary>
/// Generates TypeScript for the Innovation.Web React frontend:
/// 1. Types — triggers Reinforced.Typings via dotnet build (C# → TS interfaces)
/// 2. Routes — reads MVC controllers ([Route] attributes) AND minimal API endpoints (MapGet/MapPost source parsing)
///
/// Output structure matches Laravel's Wayfinder:
///   routes/index.ts                    — root routes + re-exports subdirs
///   routes/admin/challenges/index.ts   — admin challenge page routes
///   routes/api/v1/challenges/index.ts  — API challenge endpoint routes
///
/// Usage: dotnet run --project src/Innovation.TsGen
/// </summary>
public static class Program
{
    record RouteInfo(string Url, string Method, List<string> Parameters, string Controller, string Action);

    public static void Main(string[] args)
    {
        var root = FindProjectRoot();
        var clientAppSrc = Path.Combine(root, "src", "Innovation.Web", "ClientApp", "src");

        Console.WriteLine("=== Innovation.TsGen ===");
        Console.WriteLine();

        // Step 1: Generate types via Reinforced.Typings
        Console.WriteLine("[1/2] Generating types (Reinforced.Typings)...");
        var webCsproj = Path.Combine(root, "src", "Innovation.Web", "Innovation.Web.csproj");
        var buildResult = System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
        {
            FileName = "dotnet",
            Arguments = $"build \"{webCsproj}\" -v q --nologo",
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
        });
        buildResult?.WaitForExit();
        var typesFile = Path.Combine(clientAppSrc, "types", "generated.ts");
        if (File.Exists(typesFile))
            Console.WriteLine($"  → {Path.GetRelativePath(root, typesFile)}");
        else
            Console.WriteLine("  ⚠ types/generated.ts not found");

        // Step 2: Generate routes (controllers + endpoints)
        Console.WriteLine("[2/2] Generating routes...");
        var routesDir = Path.Combine(clientAppSrc, "routes");
        var controllerRoutes = DiscoverControllerRoutes();
        Console.WriteLine($"  Controllers: {controllerRoutes.Count} routes");

        var endpointsDir = Path.Combine(root, "src", "Innovation.Web", "Endpoints");
        var endpointRoutes = DiscoverEndpointRoutes(endpointsDir);
        Console.WriteLine($"  Endpoints:   {endpointRoutes.Count} routes");

        var allRoutes = controllerRoutes.Concat(endpointRoutes).OrderBy(r => r.Url).ToList();
        var fileCount = GenerateRouteFiles(routesDir, allRoutes);
        Console.WriteLine($"  → {allRoutes.Count} total routes in {fileCount} files");

        Console.WriteLine();
        Console.WriteLine("Done.");
    }

    static string FindProjectRoot()
    {
        var dir = Directory.GetCurrentDirectory();
        while (dir != null)
        {
            if (File.Exists(Path.Combine(dir, "Innovation.slnx")))
                return dir;
            dir = Directory.GetParent(dir)?.FullName;
        }
        return Directory.GetCurrentDirectory();
    }

    // ===================== CONTROLLER ROUTE DISCOVERY =====================

    static List<RouteInfo> DiscoverControllerRoutes()
    {
        var routes = new List<RouteInfo>();
        var assembly = typeof(Innovation.Web.Controllers.HomeController).Assembly;

        var controllerTypes = assembly.GetTypes()
            .Where(t => !t.IsAbstract && (typeof(Controller).IsAssignableFrom(t) || typeof(ControllerBase).IsAssignableFrom(t)))
            .Where(t => t.Namespace?.StartsWith("Innovation.Web") == true);

        foreach (var controller in controllerTypes)
        {
            var controllerRoute = controller.GetCustomAttribute<RouteAttribute>()?.Template ?? "";
            var methods = controller.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly);

            foreach (var method in methods)
            {
                if (method.GetCustomAttribute<NonActionAttribute>() != null) continue;

                var httpAttrs = method.GetCustomAttributes()
                    .Where(a => a is IRouteTemplateProvider)
                    .Cast<IRouteTemplateProvider>()
                    .ToList();

                var routeAttr = method.GetCustomAttribute<RouteAttribute>();
                if (httpAttrs.Count == 0 && routeAttr == null) continue;

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
                        _ => "get"
                    };
                }

                routeTemplate ??= routeAttr?.Template;
                if (routeTemplate == null) continue;

                var fullRoute = CombineRoutes(controllerRoute, routeTemplate);
                var cleanRoute = Regex.Replace(fullRoute, @"\{(\w+)(:\w+)(\?)?}", "{$1$3}");

                var parameters = Regex.Matches(cleanRoute, @"\{(\w+)\??}")
                    .Select(m => m.Groups[1].Value)
                    .ToList();

                routes.Add(new RouteInfo(
                    "/" + cleanRoute.TrimStart('/'),
                    httpMethod,
                    parameters,
                    controller.Name.Replace("Controller", ""),
                    method.Name
                ));
            }
        }

        return routes;
    }

    // ===================== ENDPOINT ROUTE DISCOVERY (Minimal API) =====================

    static List<RouteInfo> DiscoverEndpointRoutes(string endpointsDir)
    {
        var routes = new List<RouteInfo>();

        if (!Directory.Exists(endpointsDir))
            return routes;

        foreach (var file in Directory.GetFiles(endpointsDir, "*Endpoints.cs"))
        {
            var source = File.ReadAllText(file);
            var controllerName = Path.GetFileNameWithoutExtension(file).Replace("Endpoints", "");
            var parsedRoutes = ParseEndpointFile(source, controllerName);
            routes.AddRange(parsedRoutes);
        }

        return routes;
    }

    static List<RouteInfo> ParseEndpointFile(string source, string controllerName)
    {
        var routes = new List<RouteInfo>();

        // Find MapGroup prefix: app.MapGroup("/api/v1/challenges") or var group = app.MapGroup(...)
        string groupPrefix = "";
        var groupMatch = Regex.Match(source, @"MapGroup\(\s*""([^""]+)""\s*\)");
        if (groupMatch.Success)
            groupPrefix = groupMatch.Groups[1].Value.TrimEnd('/');

        // Find all Map{Method}("route", ...) calls
        // Matches: group.MapGet("/", ...) or group.MapGet("/{id:int}", ...) or app.MapGet("user/me", ...)
        var mapPattern = new Regex(
            @"(?:group|app)\s*\.\s*Map(Get|Post|Put|Delete|Patch)\s*\(\s*""([^""]+)""",
            RegexOptions.Multiline);

        foreach (Match match in mapPattern.Matches(source))
        {
            var httpMethod = match.Groups[1].Value.ToLowerInvariant();
            var routeTemplate = match.Groups[2].Value;

            // Determine full URL
            string fullRoute;
            if (match.Value.StartsWith("app"))
            {
                // Direct app.MapGet — no group prefix
                fullRoute = "/" + routeTemplate.TrimStart('/');
            }
            else
            {
                // group.MapGet — prepend group prefix
                fullRoute = groupPrefix + "/" + routeTemplate.TrimStart('/');
                fullRoute = "/" + fullRoute.TrimStart('/');
            }

            // Clean trailing slash for non-root, normalize double slashes
            fullRoute = Regex.Replace(fullRoute, @"//+", "/");
            if (fullRoute.Length > 1)
                fullRoute = fullRoute.TrimEnd('/');

            // Strip route constraints: {id:int} → {id}
            var cleanRoute = Regex.Replace(fullRoute, @"\{(\w+)(:\w+)(\?)?}", "{$1$3}");

            // Extract parameters
            var parameters = Regex.Matches(cleanRoute, @"\{(\w+)\??}")
                .Select(m => m.Groups[1].Value)
                .ToList();

            // Derive action name from method + route
            var actionName = DeriveActionName(httpMethod, routeTemplate);

            routes.Add(new RouteInfo(
                cleanRoute,
                httpMethod,
                parameters,
                controllerName,
                actionName
            ));
        }

        return routes;
    }

    /// <summary>
    /// Derives a meaningful action name from HTTP method + route template.
    /// GET /           → list
    /// GET /{id}       → get
    /// POST /          → create
    /// PUT /{id}       → update
    /// DELETE /{id}    → remove
    /// POST /{id}/advance → advance
    /// </summary>
    static string DeriveActionName(string method, string routeTemplate)
    {
        var route = routeTemplate.Trim('/');

        // Remove parameter segments for naming
        var segments = route.Split('/', StringSplitOptions.RemoveEmptyEntries)
            .Where(s => !s.StartsWith('{'))
            .ToList();

        // If there's a trailing action segment (e.g., "advance" in "/{id}/advance")
        if (segments.Count > 0)
            return ToCamelCase(segments.Last());

        // Root route — derive from HTTP method
        return method switch
        {
            "get" when !route.Contains('{') => "list",
            "get" => "get",
            "post" => "create",
            "put" => "update",
            "delete" => "remove",
            "patch" => "patch",
            _ => method
        };
    }

    // ===================== DIRECTORY-BASED ROUTE FILES =====================

    static int GenerateRouteFiles(string routesDir, List<RouteInfo> routes)
    {
        // Clean existing generated routes
        if (Directory.Exists(routesDir))
            Directory.Delete(routesDir, recursive: true);

        Directory.CreateDirectory(routesDir);

        // Group routes by directory path
        var dirGroups = new Dictionary<string, List<RouteInfo>>();

        foreach (var route in routes)
        {
            var dirPath = GetRouteDirectory(route.Url);
            if (!dirGroups.ContainsKey(dirPath))
                dirGroups[dirPath] = [];
            dirGroups[dirPath].Add(route);
        }

        // Ensure root exists
        if (!dirGroups.ContainsKey(""))
            dirGroups[""] = [];

        // Create intermediate directories that don't have routes but have children
        var allDirs = dirGroups.Keys.ToHashSet();
        var intermediates = new HashSet<string>();
        foreach (var dir in allDirs)
        {
            var parts = dir.Split('/', StringSplitOptions.RemoveEmptyEntries);
            for (int i = 1; i < parts.Length; i++)
            {
                var intermediate = string.Join("/", parts.Take(i));
                if (!allDirs.Contains(intermediate))
                    intermediates.Add(intermediate);
            }
        }
        foreach (var intermediate in intermediates)
            dirGroups[intermediate] = [];

        int fileCount = 0;

        foreach (var (dirPath, dirRoutes) in dirGroups.OrderBy(g => g.Key))
        {
            var fullDir = string.IsNullOrEmpty(dirPath)
                ? routesDir
                : Path.Combine(routesDir, dirPath.Replace("/", Path.DirectorySeparatorChar.ToString()));

            Directory.CreateDirectory(fullDir);

            var content = GenerateDirectoryIndexTs(dirPath, dirRoutes, dirGroups);
            File.WriteAllText(Path.Combine(fullDir, "index.ts"), content);
            fileCount++;
        }

        // Flatten: if a directory has only index.ts and no subdirectories,
        // replace it with {dirName}.ts in the parent directory.
        // Process bottom-up so nested flattening works correctly.
        var allGeneratedDirs = Directory.GetDirectories(routesDir, "*", SearchOption.AllDirectories)
            .OrderByDescending(d => d.Length) // deepest first
            .ToList();

        foreach (var dir in allGeneratedDirs)
        {
            var subDirs = Directory.GetDirectories(dir);
            var files = Directory.GetFiles(dir);

            // Only flatten if: exactly 1 file (index.ts), no subdirectories
            if (subDirs.Length == 0 && files.Length == 1 && Path.GetFileName(files[0]) == "index.ts")
            {
                var dirName = new DirectoryInfo(dir).Name;
                var parentDir = Directory.GetParent(dir)!.FullName;
                var targetFile = Path.Combine(parentDir, $"{dirName}.ts");

                File.Move(files[0], targetFile);
                Directory.Delete(dir);
                fileCount--; // net count stays accurate (moved, not new)
            }
        }

        return fileCount;
    }

    static string GetRouteDirectory(string url)
    {
        var segments = url.Trim('/').Split('/', StringSplitOptions.RemoveEmptyEntries)
            .Where(s => !s.StartsWith('{'))
            .ToList();

        if (segments.Count <= 1)
            return "";

        return string.Join("/", segments.Take(segments.Count - 1));
    }

    static string GenerateDirectoryIndexTs(string dirPath, List<RouteInfo> routes, Dictionary<string, List<RouteInfo>> allGroups)
    {
        var sb = new StringBuilder();

        sb.AppendLine("/**");
        sb.AppendLine(" * Auto-generated route helpers — do not edit.");
        sb.AppendLine(" * Generated by Innovation.TsGen");
        sb.AppendLine(" */");
        sb.AppendLine();

        var childDirs = allGroups.Keys
            .Where(k => k != dirPath && IsDirectChild(dirPath, k))
            .OrderBy(k => k)
            .ToList();

        sb.AppendLine("export interface RouteDefinition<M extends string = string> {");
        sb.AppendLine("    url: string;");
        sb.AppendLine("    method: M;");
        sb.AppendLine("}");
        sb.AppendLine();

        foreach (var route in routes)
        {
            var actionName = ToCamelCase(route.Action);
            var hasParams = route.Parameters.Count > 0;

            sb.AppendLine($"/** @controller {route.Controller} @action {route.Action} @route '{route.Url}' @method {route.Method} */");

            if (hasParams)
            {
                var argsType = string.Join("; ", route.Parameters.Select(p =>
                {
                    var optional = route.Url.Contains($"{{{p}?}}") ? "?" : "";
                    return $"{p}{optional}: string | number";
                }));
                var urlTemplate = BuildUrlTemplate(route);
                sb.AppendLine($"export const {actionName} = (args: {{ {argsType} }}): RouteDefinition<'{route.Method}'> => ({{");
                sb.AppendLine($"    url: `{urlTemplate}`,");
            }
            else
            {
                sb.AppendLine($"export const {actionName} = (): RouteDefinition<'{route.Method}'> => ({{");
                sb.AppendLine($"    url: '{route.Url}',");
            }
            sb.AppendLine($"    method: '{route.Method}',");
            sb.AppendLine($"}})");
            sb.AppendLine();

            if (hasParams)
            {
                var argsType = string.Join("; ", route.Parameters.Select(p =>
                {
                    var optional = route.Url.Contains($"{{{p}?}}") ? "?" : "";
                    return $"{p}{optional}: string | number";
                }));
                sb.AppendLine($"{actionName}.url = (args: {{ {argsType} }}) => `{BuildUrlTemplate(route)}`");
            }
            else
            {
                sb.AppendLine($"{actionName}.url = () => '{route.Url}'");
            }
            sb.AppendLine();
        }

        if (childDirs.Count > 0)
        {
            sb.AppendLine("// Sub-routes");
            foreach (var childDir in childDirs)
            {
                var childName = childDir.Split('/').Last();
                var importName = ToCamelCase(childName.Replace("-", " ").Split(' ').Aggregate((a, b) => a + char.ToUpper(b[0]) + b[1..]));
                sb.AppendLine($"export * as {importName} from './{childName}'");
            }
            sb.AppendLine();
        }

        return sb.ToString();
    }

    static bool IsDirectChild(string parent, string candidate)
    {
        if (string.IsNullOrEmpty(parent))
            return !candidate.Contains('/') && candidate.Length > 0;

        return candidate.StartsWith(parent + "/") &&
               !candidate[(parent.Length + 1)..].Contains('/');
    }

    static string BuildUrlTemplate(RouteInfo route)
    {
        var urlTemplate = route.Url;
        foreach (var param in route.Parameters)
        {
            urlTemplate = urlTemplate.Replace($"{{{param}}}", $"${{args.{param}}}");
            urlTemplate = urlTemplate.Replace($"{{{param}?}}", $"${{args.{param} ?? ''}}");
        }
        return urlTemplate;
    }

    static string CombineRoutes(string prefix, string template)
    {
        if (string.IsNullOrEmpty(prefix)) return template.TrimStart('/');
        if (template.StartsWith("/")) return template.TrimStart('/');
        return $"{prefix.TrimEnd('/')}/{template.TrimStart('/')}".TrimStart('/');
    }

    static string ToCamelCase(string name)
    {
        if (string.IsNullOrEmpty(name)) return name;

        // 1. Split on any non-alphanumeric char (hyphens, underscores, dots, spaces, etc.)
        // 2. Capitalize first letter of each word except the first → camelCase
        // "backchannel-logout" → "backchannelLogout"
        // "some_value.here" → "someValueHere"
        // "already camelCase" → "alreadyCamelcase"
        var words = Regex.Split(name, @"[^a-zA-Z0-9]+")
            .Where(w => w.Length > 0)
            .ToArray();

        if (words.Length == 0) return name;

        return words[0].ToLowerInvariant()
             + string.Concat(words.Skip(1).Select(w => char.ToUpperInvariant(w[0]) + w[1..].ToLowerInvariant()));
    }
}
