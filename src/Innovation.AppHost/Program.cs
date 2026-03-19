var builder = DistributedApplication.CreateBuilder(args);

// Infrastructure
var redis = builder.AddRedis("redis")
    .WithLifetime(ContainerLifetime.Persistent)
    .WithoutHttpsCertificate();

var postgres = builder.AddPostgres("postgres")
    .WithImage("ankane/pgvector")
    .WithImageTag("latest")
    .WithLifetime(ContainerLifetime.Persistent)
    .WithoutHttpsCertificate()
    .WithPgAdmin(pgAdmin => pgAdmin
        .WithLifetime(ContainerLifetime.Persistent)
        .WithoutHttpsCertificate());

var identityDb = postgres.AddDatabase("identitydb");

// Services
var identityApi = builder.AddProject<Projects.Identity_API>("identity-api")
    .WithReference(identityDb)
    .WaitFor(identityDb)
    .WithExternalHttpEndpoints();

// Vite dev server — managed by Aspire (replaces custom auto-start in Program.cs)
var vite = builder.AddViteApp("vite", "../Innovation.Web/ClientApp")
    .WithNpmPackageInstallation();

// Web App
var web = builder.AddProject<Projects.Innovation_Web>("web")
    .WithExternalHttpEndpoints()
    .WithReference(identityApi)
    .WaitFor(identityApi)
    .WithEnvironment("VITE_DEV_SERVER_URL", vite.GetEndpoint("http"));

builder.Build().Run();
