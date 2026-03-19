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

// Web App
var web = builder.AddProject<Projects.Innovation_Web>("web")
    .WithExternalHttpEndpoints()
    .WithReference(identityApi)
    .WaitFor(identityApi);

builder.Build().Run();
