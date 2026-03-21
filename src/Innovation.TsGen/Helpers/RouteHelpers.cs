using System.Text.RegularExpressions;
using Innovation.TsGen.Models;

namespace Innovation.TsGen.Helpers;

public static class RouteHelpers
{
    public static string FindProjectRoot()
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

    public static string CombineRoutes(string prefix, string template)
    {
        if (string.IsNullOrEmpty(prefix))
            return template.TrimStart('/');
        if (template.StartsWith("/"))
            return template.TrimStart('/');
        return $"{prefix.TrimEnd('/')}/{template.TrimStart('/')}".TrimStart('/');
    }

    public static string BuildUrlTemplate(RouteInfo route)
    {
        var urlTemplate = route.Url;
        foreach (var param in route.Parameters)
        {
            urlTemplate = urlTemplate.Replace($"{{{param}}}", $"${{args.{param}}}");
            urlTemplate = urlTemplate.Replace($"{{{param}?}}", $"${{args.{param} ?? ''}}");
        }
        return urlTemplate;
    }

    public static string ToCamelCase(string name)
    {
        if (string.IsNullOrEmpty(name))
            return name;

        var words = Regex.Split(name, @"[^a-zA-Z0-9]+").Where(w => w.Length > 0).ToArray();

        if (words.Length == 0)
            return name;

        return words[0].ToLowerInvariant()
            + string.Concat(
                words.Skip(1).Select(w => char.ToUpperInvariant(w[0]) + w[1..].ToLowerInvariant())
            );
    }
}
