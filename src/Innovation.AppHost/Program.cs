var builder = DistributedApplication.CreateBuilder(args);

// Publishing — container registry + deployment targets
var registry = builder.AddContainerRegistry("dockerhub", "docker.io", "awaleed0011");
var publishTarget = builder.Configuration["PUBLISH_TARGET"];
if (publishTarget == "kubernetes")
    builder.AddKubernetesEnvironment("innovation-k8s");
else
    builder.AddDockerComposeEnvironment("innovation");

// Infrastructure
var redis = builder
    .AddRedis("redis")
    .WithLifetime(ContainerLifetime.Persistent)
    .WithoutHttpsCertificate();

var postgres = builder
    .AddPostgres("postgres")
    .WithImage("ankane/pgvector")
    .WithImageTag("latest")
    .WithLifetime(ContainerLifetime.Persistent)
    .WithoutHttpsCertificate()
    .WithPgAdmin(pgAdmin =>
        pgAdmin.WithLifetime(ContainerLifetime.Persistent).WithoutHttpsCertificate()
    );

var innovationDb = postgres.AddDatabase("innovationdb");

// Fake Active Directory (OpenLDAP)
var ldap = builder
    .AddContainer("openldap", "osixia/openldap", "latest")
    .WithLifetime(ContainerLifetime.Persistent)
    .WithEndpoint(port: 1389, targetPort: 389, name: "ldap")
    .WithEnvironment("LDAP_ORGANISATION", "Company")
    .WithEnvironment("LDAP_DOMAIN", "company.local")
    .WithEnvironment("LDAP_ADMIN_PASSWORD", "adminpassword")
    .WithEnvironment("LDAP_REMOVE_CONFIG_AFTER_SETUP", "false");

// Bind mounts for config files (not supported by Kubernetes publisher)
if (publishTarget != "kubernetes")
{
    ldap.WithBindMount("./ldap", "/container/service/slapd/assets/config/bootstrap/ldif/custom");
}

// phpLDAPadmin — browse/edit fake AD at :8081
builder
    .AddContainer("phpldapadmin", "osixia/phpldapadmin", "latest")
    .WithLifetime(ContainerLifetime.Persistent)
    .WithEndpoint(port: 8081, targetPort: 443, name: "https", scheme: "https")
    .WithEnvironment("PHPLDAPADMIN_LDAP_HOSTS", "openldap")
    .WaitFor(ldap);

// Keycloak — identity provider with LDAP federation + custom theme
var keycloak = builder
    .AddKeycloak("keycloak", 8080)
    .WithLifetime(ContainerLifetime.Persistent)
    .WithRealmImport("./KeycloakRealms")
    .WithExternalHttpEndpoints()
    .WaitFor(ldap);

// Keycloak theme bind mount (not supported by Kubernetes publisher)
if (publishTarget != "kubernetes")
{
    keycloak.WithBindMount("./KeycloakThemes", "/opt/keycloak/providers");
}

// Web App
var web = builder
    .AddProject<Projects.Innovation_Web>("web")
    .WithExternalHttpEndpoints()
    .WithContainerRegistry(registry)
    .WithReference(innovationDb)
    .WithReference(keycloak)
    .WithReference(redis)
    .WaitFor(postgres)
    .WaitFor(keycloak)
    .WaitFor(redis);

// Vite dev server — only for local development, not needed in published deployments
if (!builder.ExecutionContext.IsPublishMode)
{
    var vite = builder
        .AddViteApp("vite", "../Innovation.Web/ClientApp")
        .WithNpmPackageInstallation();
    web.WithEnvironment("VITE_DEV_SERVER_URL", vite.GetEndpoint("http"));
}

builder.Build().Run();
