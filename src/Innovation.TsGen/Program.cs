using Innovation.TsGen.Generators;

Console.WriteLine("=== Innovation.TsGen ===");
Console.WriteLine();

TypeGenerator.Generate();
RouteGenerator.Generate();
PermissionGenerator.Generate();
FilterGenerator.Generate();

Console.WriteLine();
Console.WriteLine("Done.");
