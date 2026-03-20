using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;

namespace Innovation.TsGen;

/// <summary>
/// Generates TypeScript for the Innovation.Web React frontend:
/// 1. Types — triggers Reinforced.Typings via dotnet build (C# → TS interfaces)
/// 2. Routes — reads [Route] attributes from MVC controllers (→ directory-based typed route files)
///
/// Output structure matches Laravel's Wayfinder:
///   routes/index.ts          — root routes + re-exports subdirs
///   routes/auth/index.ts     — auth routes
///   routes/api/auth/index.ts — API auth routes
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

        // Step 2: Generate routes
        Console.WriteLine("[2/2] Generating routes...");
        var routesDir = Path.Combine(clientAppSrc, "routes");
        var routes = DiscoverRoutes();
        var fileCount = GenerateRouteFiles(routesDir, routes);
        Console.WriteLine($"  → {routes.Count} routes in {fileCount} files");

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

    // ===================== ROUTE DISCOVERY =====================

    static List<RouteInfo> DiscoverRoutes()
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

                // Strip route constraints like :int, :guid, :alpha from {param:constraint}
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

        return routes.OrderBy(r => r.Url).ToList();
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
        // e.g. "api/auth" exists but "api" doesn't — create "api" as a pass-through
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

        // Generate each directory's index.ts
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

        return fileCount;
    }

    /// <summary>
    /// Determines the directory for a route URL.
    /// / → "" (root), /login → "" (root), /api/auth/login → "api/auth"
    /// </summary>
    static string GetRouteDirectory(string url)
    {
        var segments = url.Trim('/').Split('/', StringSplitOptions.RemoveEmptyEntries)
            .Where(s => !s.StartsWith('{')) // skip {param} segments
            .ToList();

        // Root routes (/, /login, /register, /dashboard) go in root
        if (segments.Count <= 1)
            return "";

        // Multi-segment: all but last segment become the directory
        // /api/auth/login → api/auth
        // /admin/challenges → admin/challenges (if "challenges" is a known path group)
        // But for API routes like /api/auth/register, the action is the last segment
        return string.Join("/", segments.Take(segments.Count - 1));
    }

    static string GenerateDirectoryIndexTs(string dirPath, List<RouteInfo> routes, Dictionary<string, List<RouteInfo>> allGroups)
    {
        var sb = new StringBuilder();
        var relativeToRoot = string.IsNullOrEmpty(dirPath) ? "." : string.Join("/", dirPath.Split('/').Select(_ => ".."));

        sb.AppendLine("/**");
        sb.AppendLine(" * Auto-generated route helpers — do not edit.");
        sb.AppendLine($" * Generated by Innovation.TsGen");
        sb.AppendLine(" */");
        sb.AppendLine();

        // Find child directories to re-export
        var childDirs = allGroups.Keys
            .Where(k => k != dirPath && IsDirectChild(dirPath, k))
            .OrderBy(k => k)
            .ToList();

        sb.AppendLine("export interface RouteDefinition<M extends string = string> {");
        sb.AppendLine("    url: string;");
        sb.AppendLine("    method: M;");
        sb.AppendLine("}");
        sb.AppendLine();

        // Generate route functions for this directory
        foreach (var route in routes)
        {
            var actionName = ToCamelCase(route.Action);
            var hasParams = route.Parameters.Count > 0;

            sb.AppendLine($"/** @controller {route.Controller} @action {route.Action} @route '{route.Url}' */");

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

            // .url helper
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

        // Re-export child directories
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

    // ===================== HELPERS =====================

    static string CombineRoutes(string prefix, string template)
    {
        if (string.IsNullOrEmpty(prefix)) return template.TrimStart('/');
        if (template.StartsWith("/")) return template.TrimStart('/');
        return $"{prefix.TrimEnd('/')}/{template.TrimStart('/')}".TrimStart('/');
    }

    static string ToCamelCase(string name)
    {
        if (string.IsNullOrEmpty(name)) return name;
        return char.ToLowerInvariant(name[0]) + name[1..];
    }
}
