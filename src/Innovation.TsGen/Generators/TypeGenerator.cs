using Innovation.TsGen.Helpers;

namespace Innovation.TsGen.Generators;

public static class TypeGenerator
{
    public static void Generate()
    {
        var root = RouteHelpers.FindProjectRoot();
        var clientAppSrc = Path.Combine(root, "src", "Innovation.Web", "ClientApp", "src");

        Console.WriteLine("[1/3] Generating types (Reinforced.Typings)...");
        var webCsproj = Path.Combine(root, "src", "Innovation.Web", "Innovation.Web.csproj");
        var buildResult = System.Diagnostics.Process.Start(
            new System.Diagnostics.ProcessStartInfo
            {
                FileName = "dotnet",
                Arguments = $"build \"{webCsproj}\" -v q --nologo",
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
            }
        );
        buildResult?.WaitForExit();
        var typesFile = Path.Combine(clientAppSrc, "types", "generated.ts");
        if (File.Exists(typesFile))
            Console.WriteLine($"  → {Path.GetRelativePath(root, typesFile)}");
        else
            Console.WriteLine("  ⚠ types/generated.ts not found");
    }
}
