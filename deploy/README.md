# Innovation Platform — Deployment Guide

## Prerequisites

- **Docker Compose:** Docker Engine 24+ with Compose V2
- **Kubernetes:** kubectl + Helm 3 (optional)
- **Windows native:** .NET 10 runtime (included in self-contained EXE)

## Option A — Docker Compose (Recommended)

Best for single-server on-prem deployments.

```bash
cd docker-compose

# 1. Configure environment
cp .env.example .env
# Edit .env — set passwords, domain, ports

# 2. Start all services
docker compose up -d

# 3. Access
# App:      http://localhost:5200
# Keycloak: http://localhost:8080 (admin console)
```

### Updating

```bash
docker compose pull    # pull latest images from Docker Hub
docker compose up -d   # restart with new images
```

## Option B — Kubernetes

Best for clusters, HA, or enterprise environments with existing K8s infrastructure.

```bash
cd kubernetes

# 1. Update values.yaml with your configuration
# 2. Deploy
helm install innovation . -f values.yaml

# 3. Or apply raw manifests
kubectl apply -f .
```

## Option C — Windows Native

Run the web app as a native Windows EXE with Docker only for infrastructure.

```bash
# 1. Start infrastructure (Postgres, Redis, Keycloak, OpenLDAP)
cd docker-compose
docker compose up -d postgres redis keycloak openldap

# 2. Run the web app
cd ..\windows
set ConnectionStrings__innovationdb=Host=localhost;Port=5432;Database=innovationdb;Username=innovation;Password=YOUR_PASSWORD
set ConnectionStrings__redis=localhost:6379
set ConnectionStrings__keycloak=http://localhost:8080
set Keycloak__credentials__secret=innovation-web-secret
set ASPNETCORE_ENVIRONMENT=Production
Innovation.Web.exe
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_USER` | PostgreSQL username | `innovation` |
| `POSTGRES_PASSWORD` | PostgreSQL password | *(required)* |
| `POSTGRES_DB` | PostgreSQL database name | `innovationdb` |
| `KEYCLOAK_ADMIN` | Keycloak admin username | `admin` |
| `KEYCLOAK_ADMIN_PASSWORD` | Keycloak admin password | *(required)* |
| `KEYCLOAK_CLIENT_SECRET` | OIDC client secret | `innovation-web-secret` |
| `LDAP_ORGANISATION` | LDAP organization name | `Company` |
| `LDAP_DOMAIN` | LDAP domain | `company.local` |
| `LDAP_ADMIN_PASSWORD` | LDAP admin password | *(required)* |
| `APP_PORT` | Web app external port | `5200` |

### Using Your Own Identity Provider

To use an existing Keycloak, Active Directory, or other OIDC provider instead of the bundled one:

1. Remove or don't start the `keycloak` and `openldap` services
2. Set these environment variables on the web app:
   - `ConnectionStrings__keycloak=https://your-idp.example.com`
   - `Keycloak__realm=your-realm`
   - `Keycloak__resource=your-client-id`
   - `Keycloak__credentials__secret=your-client-secret`

Your OIDC provider must support standard Keycloak-compatible endpoints.

## HTTPS / Reverse Proxy

In production, place a reverse proxy (nginx, Caddy, Traefik) in front of the web app to terminate TLS:

```
Client → HTTPS → Reverse Proxy → HTTP → Innovation.Web (:8080)
```

Set `ASPNETCORE_FORWARDEDHEADERS_ENABLED=true` on the web app so it correctly generates HTTPS redirect URLs.

## Important Notes

- **Database migrations** run automatically on first startup — ensure the PostgreSQL user has DDL permissions.
- **Keycloak realm** is imported only on first startup. To update realm config later, use the Keycloak admin console.
- **LDAP seed data** (users/groups) is loaded only on first OpenLDAP startup.
- **Passwords** in `.env.example` are placeholders — change them before deploying.
