# Innovation-dotnet: Architecture Validation, Package Stack & Porting Plan

## Context

Comparing innovation-dotnet against Microsoft's eShop reference app and current .NET ecosystem (2025-2026) to validate our architecture, select the best packages, and plan the port of the PHP Laravel innovation platform (~75 models, 6 modules, AI features).

---

## 1. Architecture Validation: What We Do WELL

| Pattern | Our Approach | eShop / Community | Verdict |
|---|---|---|---|
| **Clean Arch + Vertical Slices** | Co-located command/handler/validator/DTO per feature inside CA layers | eShop separates into `Commands/`, `Validations/` folders; Milan Jovanovic & community recommend our hybrid | **Validated -- best of both worlds** |
| **CQRS with MediatR** | `ICommand<T>` / `IQuery<T>` markers + pipeline behaviors | eShop uses raw `IRequest<T>`; Ardalis & Jason Taylor templates do the same | **Our markers are cleaner** |
| **Manual mapping** | Extension methods (`ToListResponse()`) | eShop uses LINQ projections; ABP moved to Mapperly; no one recommends AutoMapper anymore | **Valid -- consider Mapperly for scale** |
| **FluentValidation** | Pipeline behavior | Universal standard, still free (Apache 2.0) | **Keep** |
| **EF Core interceptors** | `AuditableInterceptor`, `SoftDeleteInterceptor` | eShop uses domain events instead; both valid | **Keep -- more transparent** |
| **TranslatableString** | `OwnsOne().ToJson()` for en/ar | No equivalent in eShop; good domain design | **Keep** |
| **Result\<T\>** | `Success/Failure/NotFound` | eShop throws exceptions; community prefers ErrorOr | **Upgrade to ErrorOr** |
| **PaginatedList\<T\>** | `CreateAsync()` with IQueryable | Better than eShop's simple DTO | **Keep** |
| **Aspire orchestration** | Redis, PostgreSQL, Keycloak, OpenLDAP, Vite | Matches eShop pattern; Microsoft's recommended approach | **Keep** |
| **ULID for public IDs** | Dual `int Id` + `string PublicUlid` | Better than eShop's plain `int` for API security | **Keep** |

**Bottom line: Our architecture is solid and aligns with industry best practices.**

---

## 2. Licensing Alert: Critical Package Changes (2025)

Three major .NET libraries went commercial. This affects our stack decisions:

| Library | New License | Free Tier | Recommended Alternative |
|---------|------------|-----------|------------------------|
| **MediatR** v13+ | RPL-1.5 + Commercial | < $5M revenue | **Keep if eligible**, else switch to Mediator (source-gen) or Wolverine |
| **AutoMapper** v15+ | RPL-1.5 + Commercial | < $5M revenue | **Mapperly** (compile-time, zero overhead, MIT) |
| **MassTransit** v9+ | Commercial | < $1M revenue | **Wolverine** (MIT) or direct RabbitMQ client |

**Decision**: We don't use AutoMapper (good). We use MediatR -- keep it if under the free tier, otherwise evaluate Wolverine or the source-gen Mediator library.

---

## 3. Recommended Package Stack

### Core Architecture

| Category | Package | NuGet ID | Why |
|----------|---------|----------|-----|
| **CQRS/Mediator** | MediatR (current) | `MediatR` | Keep if < $5M revenue. Already integrated. |
| **Validation** | FluentValidation | `FluentValidation` | Still the standard. Apache 2.0. |
| **Result Pattern** | ErrorOr | `ErrorOr` | Replace our `Result<T>`. Cleaner discriminated unions, built-in error types (`Validation`, `NotFound`, `Forbidden`), fluent `Match`/`Then`/`FailIf`. By Amichai Mantinband (Microsoft). |
| **Mapping** | Mapperly | `Riok.Mapperly` | Compile-time source generator. Zero runtime overhead. ABP Framework switched to it. Use when manual mapping becomes tedious at scale. |
| **Filtering/Sorting** | Gridify | `Gridify` + `Gridify.EntityFramework` | Converts query strings to LINQ. Near-zero overhead. Replaces Spatie QueryBuilder. |
| **OpenAPI UI** | Scalar | `Scalar.AspNetCore` | Now the .NET default (replaced Swagger UI). Modern dark theme, built-in API testing. |
| **API Versioning** | Asp.Versioning | `Asp.Versioning.Http` | Replace manual `/api/v1/` prefix. Header + URL versioning. |

### Infrastructure

| Category | Package | NuGet ID | Why |
|----------|---------|----------|-----|
| **Background Jobs** | Hangfire | `Hangfire.Core` + `Hangfire.PostgreSql` | Closest to Laravel Horizon. Dashboard, retries, fire-and-forget, recurring. LGPL v3. |
| **Messaging** | Start with `Channel<T>` | Built-in | In-process first. Graduate to RabbitMQ via `Aspire.Hosting.RabbitMQ` + MassTransit/Wolverine later. |
| **File Storage** | FluentStorage | `FluentStorage` | Unified `IBlobStorage` across local/Azure/S3. Like Laravel `Storage::disk()`. |
| **Image Processing** | ImageSharp | `SixLabors.ImageSharp` | Fully managed .NET. Free < $1M revenue. |
| **Real-time** | SignalR | Built-in ASP.NET Core | Replace Laravel Echo. Strongly-typed hubs, Redis backplane. |
| **Email** | FluentEmail + MailKit | `FluentEmail.Core` + `FluentEmail.MailKit` | Fluent builder + Razor templates + SMTP. |
| **Audit Logging** | Audit.NET | `Audit.NET` + `Audit.EntityFramework` | Auto-intercepts SaveChanges, logs old/new values. Replaces Spatie ActivityLog. |

### AI & Search

| Category | Package | NuGet ID | Why |
|----------|---------|----------|-----|
| **AI Abstraction** | Microsoft.Extensions.AI | `Microsoft.Extensions.AI` | Official MS unified AI layer. `IChatClient`, `IEmbeddingGenerator`. GA (not preview). |
| **Vector DB** | pgvector for EF Core | `Pgvector.EntityFrameworkCore` | Vector columns in existing PostgreSQL. Same pattern as eShop. |
| **Full-Text Search** | PostgreSQL FTS | Built-in EF Core | `EF.Functions.ToTsVector()`. Zero extra infrastructure. Graduate to Meilisearch later. |

### Testing

| Category | Package | NuGet ID | Why |
|----------|---------|----------|-----|
| **Framework** | xUnit | `xunit` | Microsoft's default. Parallel execution, test isolation. |
| **Mocking** | NSubstitute | `NSubstitute` | Cleanest syntax. Community moved here after Moq controversy. |
| **Containers** | Testcontainers | `Testcontainers` + `Testcontainers.PostgreSql` | Throwaway Docker containers for integration tests. |
| **DB Reset** | Respawn | `Respawn` | Fast database cleanup between tests (~50ms). |
| **Fake Data** | Bogus | `Bogus` | Strongly typed fake data generator. |

### Document Generation

| Category | Package | NuGet ID | Why |
|----------|---------|----------|-----|
| **Excel** | ClosedXML | `ClosedXML` | MIT. Replaces Laravel Maatwebsite Excel. |
| **PDF** | QuestPDF | `QuestPDF` | Best .NET PDF library. Fluent API, Arabic text support. Free < $1M. |

---

## 4. Patterns to Adopt from eShop

### 4A. Domain Events (Critical for Evaluations & AI Triage)

Add to `BaseEntity`:
```csharp
private List<INotification>? _domainEvents;
public IReadOnlyCollection<INotification>? DomainEvents => _domainEvents?.AsReadOnly();
public void AddDomainEvent(INotification eventItem) { ... }
public void ClearDomainEvents() { ... }
```

Add `MediatorExtension.DispatchDomainEventsAsync()` in Infrastructure. Override `SaveChangesAsync` in `AppDbContext` to dispatch before save.

### 4B. TransactionBehavior

New `TransactionBehavior<TRequest, TResponse>` that wraps `ICommand<T>` handlers in a DB transaction. Dispatches domain events within the transaction.

### 4C. IAggregateRoot Marker

Simple marker interface for entities that are aggregate roots (Ideas, EvaluationSessions). Repositories only for aggregates; keep `IAppDbContext` for simple CRUD.

### 4D. ErrorOr Integration

Replace `Result<T>` with `ErrorOr<T>` in handlers. Map errors to HTTP responses in endpoints:
```csharp
return result.Match(
    onValue: value => Results.Ok(value),
    onError: errors => errors.First().Type switch {
        ErrorType.NotFound => Results.NotFound(),
        ErrorType.Validation => Results.BadRequest(errors),
        _ => Results.Problem()
    });
```

---

## 5. PHP Feature Porting: Spatie Package Equivalents

| Laravel/Spatie Package | .NET Replacement | Notes |
|---|---|---|
| **spatie/laravel-permission** | ASP.NET Core Authorization + Keycloak.AuthServices.Authorization | Realm roles as JWT claims → `AddPolicy()` |
| **spatie/laravel-activitylog** | Audit.NET + Audit.EntityFramework | Auto-intercepts EF SaveChanges |
| **spatie/laravel-medialibrary** | Custom `IMediaService` + FluentStorage + ImageSharp | No direct equivalent; build polymorphic `MediaItem` entity |
| **spatie/laravel-translatable** | TranslatableString (already done) | `OwnsOne().ToJson()` |
| **spatie/laravel-tags** | Custom `Tag` + `Taggable` entities | Polymorphic many-to-many |
| **spatie/laravel-query-builder** | Gridify | String-to-LINQ conversion |
| **spatie/laravel-settings** | `IOptions<T>` + custom DB provider | Settings table with typed access |
| **maatwebsite/excel** | ClosedXML | MIT, fluent API |
| **Laravel Horizon (queues)** | Hangfire | Dashboard, retries, PostgreSQL storage |
| **Laravel Echo (websocket)** | SignalR | Built-in ASP.NET Core |
| **openai-php/client** | Microsoft.Extensions.AI | `IChatClient`, `IEmbeddingGenerator` |

---

## 6. Implementation Sequencing

### Phase 1: Foundation Enhancements
**Files to modify/create:**

| File | Action |
|---|---|
| `Domain/BaseEntity.cs` | Add domain event support |
| `Domain/IAggregateRoot.cs` | New -- marker interface |
| `Infrastructure/MediatorExtension.cs` | New -- dispatch domain events |
| `Infrastructure/Data/AppDbContext.cs` | Override SaveChangesAsync |
| `Application/Behaviors/TransactionBehavior.cs` | New -- DB transaction wrapper |
| `Application/DependencyInjection.cs` | Register TransactionBehavior |

**Commands:**
```bash
# Add new packages to Web project
dotnet add src/Innovation.Web/Innovation.Web.csproj package ErrorOr
dotnet add src/Innovation.Web/Innovation.Web.csproj package Scalar.AspNetCore
dotnet add src/Innovation.Web/Innovation.Web.csproj package Gridify.EntityFramework

# Add to Application project
dotnet add src/Innovation.Application/Innovation.Application.csproj package ErrorOr

# Set up test project
dotnet new xunit -n Innovation.UnitTests -o tests/Innovation.UnitTests
dotnet add tests/Innovation.UnitTests/Innovation.UnitTests.csproj package NSubstitute
dotnet add tests/Innovation.UnitTests/Innovation.UnitTests.csproj package Bogus
dotnet add tests/Innovation.UnitTests/Innovation.UnitTests.csproj package Respawn
dotnet add tests/Innovation.UnitTests/Innovation.UnitTests.csproj reference src/Innovation.Application/Innovation.Application.csproj
dotnet add tests/Innovation.UnitTests/Innovation.UnitTests.csproj reference src/Innovation.Infrastructure/Innovation.Infrastructure.csproj
dotnet sln add tests/Innovation.UnitTests/Innovation.UnitTests.csproj

# Integration test project
dotnet new xunit -n Innovation.IntegrationTests -o tests/Innovation.IntegrationTests
dotnet add tests/Innovation.IntegrationTests/Innovation.IntegrationTests.csproj package Testcontainers.PostgreSql
dotnet add tests/Innovation.IntegrationTests/Innovation.IntegrationTests.csproj package Respawn
dotnet add tests/Innovation.IntegrationTests/Innovation.IntegrationTests.csproj package Bogus
dotnet add tests/Innovation.IntegrationTests/Innovation.IntegrationTests.csproj package Microsoft.AspNetCore.Mvc.Testing
dotnet sln add tests/Innovation.IntegrationTests/Innovation.IntegrationTests.csproj
```

### Phase 2: Ideas Module
- Port `Idea` aggregate root with rich domain behavior
- CRUD handlers with ErrorOr returns
- Media upload via `IMediaService` + FluentStorage
- Domain events for status transitions
- Gridify for list filtering

### Phase 3: Evaluations Module
- Rich domain model following eShop's `Order` pattern
- `EvaluationSession` with private setters, behavior methods
- Domain events: `EvaluationSubmitted`, `StageCompleted`
- Multi-evaluator scoring and aggregation

### Phase 4: AI Screening
- `IInnovationAI` service using `Microsoft.Extensions.AI`
- `IChatClient` for LLM completions, `IEmbeddingGenerator` for embeddings
- `Pgvector.EntityFrameworkCore` for vector columns
- Triage pipeline with custom pipe stages
- Hangfire jobs for async AI processing

### Phase 5: Supporting Features
- Comments, Announcements (simple CRUD)
- Tags (polymorphic entities)
- Notifications (SignalR + `Notification` entity)
- Audit logging (Audit.NET)
- Permissions (Keycloak.AuthServices.Authorization policies)
- Excel export (ClosedXML), PDF generation (QuestPDF)
- Forecasting/Radar module

---

## 7. Verification

- `dotnet build` after each phase
- `dotnet test` after test project setup
- Verify Challenges feature still works after BaseEntity changes (additive)
- Test API via Scalar UI (replacing Swagger)
- Verify Aspire `dotnet run --project src/Innovation.AppHost` starts all services
- Integration tests with Testcontainers for database operations
