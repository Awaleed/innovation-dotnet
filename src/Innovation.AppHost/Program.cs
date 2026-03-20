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

// Keycloak — identity provider (replaces Identity.API)
var keycloak = builder.AddKeycloak("keycloak", 8080)
    .WithLifetime(ContainerLifetime.Persistent)
    .WithRealmImport("./KeycloakRealms")
    .WithExternalHttpEndpoints();

// Vite dev server — managed by Aspire
var vite = builder.AddViteApp("vite", "../Innovation.Web/ClientApp")
    .WithNpmPackageInstallation();

// Web App
var web = builder.AddProject<Projects.Innovation_Web>("web")
    .WithExternalHttpEndpoints()
    .WithReference(keycloak)
    .WaitFor(keycloak)
    .WithEnvironment("VITE_DEV_SERVER_URL", vite.GetEndpoint("http"));

builder.Build().Run();
