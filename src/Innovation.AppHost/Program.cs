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

// Fake Active Directory (OpenLDAP)
var ldap = builder.AddContainer("openldap", "osixia/openldap", "latest")
    .WithLifetime(ContainerLifetime.Persistent)
    .WithEndpoint(port: 1389, targetPort: 389, name: "ldap")
    .WithEnvironment("LDAP_ORGANISATION", "Company")
    .WithEnvironment("LDAP_DOMAIN", "company.local")
    .WithEnvironment("LDAP_ADMIN_PASSWORD", "adminpassword")
    .WithEnvironment("LDAP_REMOVE_CONFIG_AFTER_SETUP", "false")
    .WithBindMount("./ldap",
        "/container/service/slapd/assets/config/bootstrap/ldif/custom");

// phpLDAPadmin — browse/edit fake AD at :8081
builder.AddContainer("phpldapadmin", "osixia/phpldapadmin", "latest")
    .WithLifetime(ContainerLifetime.Persistent)
    .WithEndpoint(port: 8081, targetPort: 443, name: "https", scheme: "https")
    .WithEnvironment("PHPLDAPADMIN_LDAP_HOSTS", "openldap")
    .WaitFor(ldap);

// Keycloak — identity provider with LDAP federation + custom theme
var keycloak = builder.AddKeycloak("keycloak", 8080)
    .WithLifetime(ContainerLifetime.Persistent)
    .WithRealmImport("./KeycloakRealms")
    .WithBindMount("../Innovation.KeycloakTheme/dist_keycloak", "/opt/keycloak/providers")
    .WithExternalHttpEndpoints()
    .WaitFor(ldap);

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
