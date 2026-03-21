# Innovation Platform (.NET)

## Architecture

**Vertical Slice Architecture** with Clean Architecture layering:

```
Domain → Application → Infrastructure → Web
```

### Project Structure

| Project | Responsibility |
|---|---|
| `Innovation.Domain` | Entities, enums, value objects. No dependencies. |
| `Innovation.Application` | CQRS handlers (MediatR), validators, interfaces. Depends on Domain. |
| `Innovation.Infrastructure` | EF Core, external services, DI registration. Depends on Application. |
| `Innovation.Web` | ASP.NET Core host: controllers (Inertia pages), endpoints (JSON API), middleware. |
| `Innovation.ServiceDefaults` | Aspire service defaults (health checks, OpenTelemetry). |
| `Innovation.AppHost` | Aspire orchestration (Redis, PostgreSQL, Keycloak, OpenLDAP, Vite). |

### Feature Organization (Vertical Slices)

Each feature lives in its own folder under `Application/Features/`:

```
Application/Features/{Feature}/
  Create{Feature}.cs       ← command + handler + validator
  List{Features}.cs        ← query + handler
  Get{Feature}.cs          ← query + handler
  Update{Feature}.cs       ← command + handler
  Delete{Feature}.cs       ← command + handler
  Shared/                  ← DTOs + mapping for this feature
```

### Web Layer Convention

- **Controllers** (`Controllers/`) — render Inertia pages via `Inertia.Render()`. For server-side page navigation.
- **Endpoints** (`Endpoints/`) — return JSON via minimal API `Results.*`. For REST API consumed by frontend XHR.
- **Extensions** (`Extensions/`) — `IServiceCollection`/`WebApplicationBuilder` extension methods for DI setup.

Naming: `{Feature}Controller.cs` for pages, `{Feature}Endpoints.cs` for API.

### Authentication

- Keycloak OIDC + Cookie auth via `Keycloak.AuthServices` package
- Auth config in `Extensions/AuthenticationExtensions.cs`
- Backchannel logout endpoint in `Endpoints/AuthEndpoints.cs`
- User sync on login (upsert local User from Keycloak claims in `OnTokenValidated`)
- Session revocation via Redis distributed cache

### When to Split Projects

Keep single Web project until:
- Multiple teams own different features independently
- A feature needs independent deployment/scaling
- API surface exceeds ~30 endpoint files
