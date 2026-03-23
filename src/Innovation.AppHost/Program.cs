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
var phpDb = postgres.AddDatabase("phpdb", "innovation"); // PHP Laravel database

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

// PHP Legacy App (Laravel) — Strangler Fig migration
var phpContextPath = "../../../innovation";
var php = builder
    .AddDockerfile("php", phpContextPath,
        builder.ExecutionContext.IsPublishMode ? "Dockerfile" : "Dockerfile.dev")
    .WithHttpEndpoint(port: 8000, targetPort: 8080, name: "http")
    .WithExternalHttpEndpoints()
    .WithLifetime(ContainerLifetime.Persistent)
    // Aspire references (for health checks + dependency ordering)
    .WithReference(phpDb)
    .WithReference(redis)
    .WithReference(keycloak)
    .WaitFor(postgres)
    .WaitFor(keycloak)
    .WaitFor(redis)
    // Laravel app config
    .WithEnvironment("APP_NAME", "Innovation Lab")
    .WithEnvironment("APP_ENV", builder.ExecutionContext.IsPublishMode ? "production" : "local")
    .WithEnvironment("APP_DEBUG", builder.ExecutionContext.IsPublishMode ? "false" : "true")
    .WithEnvironment("APP_KEY", "base64:L8lLlZZp8Ir4N4i5Yi5Htr1sOXYdVBQSTEq1eW5OupU=")
    .WithEnvironment("APP_URL", "http://localhost:8000")
    .WithEnvironment("APP_TIMEZONE", "Asia/Riyadh")
    .WithEnvironment("APP_LOCALE", "ar")
    .WithEnvironment("APP_FALLBACK_LOCALE", "en")
    // Database — map Aspire references to Laravel env var names
    .WithEnvironment("DB_CONNECTION", "pgsql")
    .WithEnvironment(ctx => ctx.EnvironmentVariables["DB_HOST"] = phpDb.Resource.Parent.PrimaryEndpoint.Property(EndpointProperty.Host))
    .WithEnvironment(ctx => ctx.EnvironmentVariables["DB_PORT"] = phpDb.Resource.Parent.PrimaryEndpoint.Property(EndpointProperty.Port))
    .WithEnvironment(ctx => ctx.EnvironmentVariables["DB_DATABASE"] = phpDb.Resource.DatabaseName)
    .WithEnvironment(ctx => ctx.EnvironmentVariables["DB_USERNAME"] = phpDb.Resource.Parent.UserNameReference)
    .WithEnvironment(ctx => ctx.EnvironmentVariables["DB_PASSWORD"] = phpDb.Resource.Parent.PasswordParameter)
    // Redis
    .WithEnvironment(ctx => ctx.EnvironmentVariables["REDIS_HOST"] = redis.Resource.PrimaryEndpoint.Property(EndpointProperty.Host))
    .WithEnvironment(ctx => ctx.EnvironmentVariables["REDIS_PORT"] = redis.Resource.PrimaryEndpoint.Property(EndpointProperty.Port))
    .WithEnvironment(ctx => ctx.EnvironmentVariables["REDIS_PASSWORD"] = redis.Resource.PasswordParameter!)
    // Session/Cache/Queue
    .WithEnvironment("SESSION_DRIVER", "redis")
    .WithEnvironment("CACHE_STORE", "redis")
    .WithEnvironment("QUEUE_CONNECTION", "redis")
    // Keycloak SSO
    .WithEnvironment("KEYCLOAK_BASE_URL", "http://localhost:8080")
    .WithEnvironment("KEYCLOAK_REDIRECT_URI", "http://localhost:3000/sso/callback")
    .WithEnvironment("KEYCLOAK_REALM", "innovation")
    .WithEnvironment("KEYCLOAK_CLIENT_ID", "innovation-php")
    .WithEnvironment("KEYCLOAK_CLIENT_SECRET", "innovation-php-secret")
    // Theme
    .WithEnvironment("CURRENT_THEME", "custom");

// Dev-only: bind mount source code + Vite HMR servers
if (!builder.ExecutionContext.IsPublishMode)
{
    // PHP source mounted for live editing
    php.WithBindMount(phpContextPath, "/var/www/html");

    // .NET Vite dev server
    var vite = builder
        .AddViteApp("vite", "../Innovation.Web/ClientApp")
        .WithNpmPackageInstallation();
    web.WithEnvironment("VITE_DEV_SERVER_URL", vite.GetEndpoint("http"));

    // PHP Vite dev server
    var phpVite = builder
        .AddViteApp("php-vite", phpContextPath)
        .WithNpmPackageInstallation();
    php.WithEnvironment("VITE_DEV_SERVER_URL", phpVite.GetEndpoint("http"));
}

builder.Build().Run();
