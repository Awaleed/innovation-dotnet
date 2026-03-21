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

## 4. Frontend Reuse Strategy

### Current State

The PHP project has **~900+ frontend files** (416 pages, 278 components, 32 hooks, 69 lib files). The .NET project already has a working React + Inertia.js frontend with the same stack (React 18, Tailwind v4, Radix UI, i18next, React Hook Form + Zod, React Query, nuqs). Only Challenges pages are implemented so far.

**Both projects share**: Same UI components (shadcn/ui), same styling (Tailwind v4), same form handling (React Hook Form + Zod), same data fetching (React Query + axios), same i18n (i18next ar/en), same state patterns (nuqs for URL state).

### What Can Be Copied Directly (Zero/Minimal Edits)

| Category | Files | Edits Needed |
|---|---|---|
| **UI components** (`components/ui/`) | All shadcn/ui primitives (button, card, input, dialog, table, tabs, accordion, etc.) | **None** -- framework-agnostic |
| **Layouts** (`layouts/`) | admin-layout, user-layout, evaluator-layout, auth-layout, public-layout | **Minimal** -- update nav links |
| **Shell components** | admin-shell, admin-header, evaluator-shell, evaluator-header, sidebar | **Minimal** -- update route helpers |
| **Translation files** (`lang/ar/`, `lang/en/`) | All 50+ JSON files | **None** -- pure data |
| **CSS/Tailwind** (`app.css`) | Theme variables, scrollbar styles, brand colors | **None** -- already ported |
| **Hooks** (most) | use-appearance, use-mobile, use-persistent-state, use-theme, use-initials, use-permissions, use-locale, use-search-history | **None** |
| **Lib/utils** | formatters.ts, constants.ts, all enum files, brand-colors.ts | **None** |
| **Providers** | theme-provider, rtl-provider | **None** -- already ported |
| **Zod schemas** | All validation schemas in forms/ | **None** |
| **Chart components** | Recharts wrappers, radar charts | **None** |

### What Needs Consistent Edits (Search & Replace)

**1. Route helpers** -- The PHP project uses Wayfinder-generated routes (`route.store()`, `route.update()`). The .NET project uses TsGen-generated routes (`admin.challenges.index()`).

**Edit pattern**: Replace Wayfinder route calls with TsGen equivalents:
```typescript
// PHP (Wayfinder)
href={aiCriteria.store()}
router.post(route('admin.challenges.store'), data)

// .NET (TsGen)
href={admin.challenges.create()}
router.post(admin.challenges.store().url, data)
```

**Action**: When copying a page, search for route calls and replace with TsGen equivalents. The route structure is similar enough that this is mechanical.

**2. Resource/DTO shape** -- PHP returns JSON:API-like `{ id, type, attributes: {}, meta: { translations: {} }, relationships: {} }`. The .NET backend currently returns flat DTOs from `ChallengeResponse` records.

**Decision**: **Match PHP format exactly.** Standardize the .NET API response shape to use `{ id, type, attributes, meta, relationships }` (see Section 5 below). This means frontend code needs **zero changes** to data access patterns.

**3. Inertia shared data** -- Both projects share auth/localization/flash through Inertia middleware. The shape is already aligned in `HandleInertiaRequests.cs` (auth.user, auth.roles, auth.permissions, localization, flash).

**Edit pattern**: Verify `SharedData` TypeScript interface matches what `HandleInertiaRequests` sends. Already done for Challenges.

**4. API pagination response** -- PHP uses `SimpleCollection` returning `{ results: [], meta: { pagination: { page, size, total, totalPages } } }`. The .NET `PaginatedList<T>` returns `{ items: [], pageIndex, totalPages, totalCount }`.

**Decision**: Add a `SimpleCollection<T>` response wrapper in .NET to match the PHP shape. The `use-api-pagination` hook will be updated once to use Gridify's native filter syntax (see below), but the response shape stays identical.

### What Needs Rewriting (Page-Specific Logic)

| Category | Reason |
|---|---|
| **Page components that call Wayfinder actions** | Replace with TsGen route + axios/Inertia calls |
| **`use-api-pagination` hook** | If we match PHP response shape → **reuse as-is**. If not → adapt to .NET pagination shape |
| **`use-wayfinder-query` hook** | Replace with direct route resolution via TsGen |
| **`generated.d.ts` types** | Auto-generated differently (PHP uses `typescript:transform`, .NET uses Reinforced.Typings). Keep TsGen approach. |
| **Echo/Pusher real-time** | Replace with SignalR client. Affects `bootstrap.ts` and `use-notifications.ts` |

### Recommended Copy Workflow Per Feature

When porting a feature (e.g., Ideas):

1. **Copy component files** from PHP `resources/js/Pages/Admin/Ideas/` → .NET `ClientApp/src/Pages/Admin/Ideas/`
2. **Copy related components** from PHP `resources/js/components/ideas/` → .NET `ClientApp/src/components/ideas/`
3. **Copy translation keys** from PHP `resources/js/lang/{ar,en}/` (any new namespaces)
4. **Copy hooks** that the pages use (check imports)
5. **Search & replace** route calls (Wayfinder → TsGen)
6. **Verify types** match the .NET DTOs (update `generated.ts` via Reinforced.Typings)
7. **Test** the page renders with real data from .NET API

### Key Consistency Rules

To maximize reuse, the .NET backend MUST follow these conventions:

1. **API response shape**: Match PHP's `SimpleCollection` format (`{ results, links, meta: { pagination } }`) for all paginated endpoints
2. **Resource shape**: Match PHP's `{ id, type, attributes, meta: { translations }, relationships }` format
3. **Filter query string format**: Use Gridify native syntax (`?filter=status=draft&orderBy=createdAt desc`). Update `use-api-pagination` hook once -- it encapsulates all filtering logic exclusively.
4. **Shared Inertia props**: Keep the same `SharedData` structure (auth, localization, flash, theme)
5. **Route naming**: Keep route structure consistent (`/admin/challenges/`, `/api/v1/ideas/`)

---

## 5. .NET Equivalents: PHP Resources, Collections & Lookups

### 5A. API Resource Pattern (Replacing Laravel Resources)

PHP uses `JsonResource` classes with `{ id, type, attributes, meta, relationships }`. We need a .NET equivalent.

**Create a base response wrapper:**

```csharp
// Application/Common/Models/ApiResource.cs
public record ApiResource<TAttributes>(
    int Id,
    string Type,
    TAttributes Attributes,
    Dictionary<string, object?>? Meta = null,
    Dictionary<string, object?>? Relationships = null
);

// Usage in mapping:
public static ApiResource<ChallengeAttributes> ToResource(this Challenge c) => new(
    Id: c.Id,
    Type: "challenge",
    Attributes: new ChallengeAttributes(c.Title, c.Status, ...),
    Meta: new Dictionary<string, object?> {
        ["translations"] = new {
            title = new { en = c.Title.En, ar = c.Title.Ar },
            description = new { en = c.Description?.En, ar = c.Description?.Ar }
        },
        ["counts"] = new { ideas = c.Ideas?.Count ?? 0 }
    },
    Relationships: new Dictionary<string, object?> {
        ["innovationType"] = c.InnovationType != null ? c.InnovationType.ToResource() : null
    }
);
```

This means **frontend resource access patterns stay identical**:
```typescript
// Works the same in both PHP and .NET frontends
challenge.attributes.title
challenge.meta.translations.title.ar
challenge.relationships.innovationType
```

### 5B. SimpleCollection Pattern (Replacing Laravel Pagination)

PHP's `SimpleCollection` wraps paginated results. Create an equivalent:

```csharp
// Application/Common/Models/SimpleCollection.cs
public record SimpleCollection<T>(
    IReadOnlyList<T> Results,
    PaginationLinks Links,
    PaginationMeta Meta
);

public record PaginationLinks(string Self, string? First, string? Prev, string? Next, string? Last);

public record PaginationMeta(PaginationInfo Pagination);

public record PaginationInfo(int Page, int Size, int Total, int TotalPages, bool MorePages);

// Extension method to convert PaginatedList<T> → SimpleCollection<T>
public static SimpleCollection<T> ToSimpleCollection<T>(
    this PaginatedList<T> list, string baseUrl) => new(
    Results: list.Items,
    Links: new PaginationLinks(...),
    Meta: new PaginationMeta(new PaginationInfo(
        Page: list.PageIndex,
        Size: list.Items.Count,
        Total: list.TotalCount,
        TotalPages: list.TotalPages,
        MorePages: list.HasNextPage
    ))
);
```

**Frontend `use-api-pagination` hook works unchanged** because the response shape matches.

### 5C. Lookup System (Replacing PHP Lookup Module)

PHP has a generic lookup system with hierarchical categories, translations, and config-driven CRUD. Port to .NET:

**Domain:**
```csharp
// Domain/Entities/Lookup.cs (already exists, enhance)
public class Lookup : BaseEntity
{
    public string Type { get; set; }           // e.g., "IDEA_CATEGORY", "DEPARTMENT"
    public TranslatableString Name { get; set; }
    public TranslatableString? Description { get; set; }
    public int? LookupId { get; set; }         // Parent (hierarchy)
    public Lookup? ParentLookup { get; set; }
    public ICollection<Lookup> SubLookups { get; set; }
    public bool IsActive { get; set; } = true;
    public int OrderColumn { get; set; }
    public JsonDocument? Metadata { get; set; } // Flexible extra data
}
```

**Endpoint -- generic lookup controller:**
```csharp
// Web/Endpoints/LookupEndpoints.cs
app.MapGet("/api/v1/lookups/{type}", async (
    string type,
    [AsParameters] LookupQueryParams query,
    IMediator mediator) =>
{
    var result = await mediator.Send(new ListLookups.Query(type, query));
    return result.Match(
        onValue: v => Results.Ok(v),
        onError: e => Results.NotFound()
    );
});

// Supports: ?filter[search]=...&forSelect=true&paginate=false
// forSelect returns [{value: id, label: name}] for dropdowns
```

**forSelect optimization** (critical for dropdowns):
```csharp
public record LookupSelectItem(int Value, string Label);

// When ?forSelect=true, return minimal data for <Select> components
if (query.ForSelect)
    return lookups.Select(l => new LookupSelectItem(l.Id, l.Name.GetTranslation(locale)));
```

### 5D. Gridify as Spatie Query Builder Replacement

PHP's Spatie Query Builder uses `?filter[status]=draft&sort=-created_at`. Gridify uses a different default syntax but can be customized.

**Option A: Use Gridify's native syntax:**
```
?filter=status=draft&orderBy=createdAt desc&page=1&pageSize=15
```

**Option B: Build a thin adapter to accept PHP-style query strings:**
```csharp
// Application/Common/QueryStringAdapter.cs
public static GridifyQuery FromPhpStyle(HttpRequest request)
{
    var filters = request.Query
        .Where(q => q.Key.StartsWith("filter["))
        .Select(q => $"{q.Key.TrimStart("filter[").TrimEnd("]")}={q.Value}");

    var sort = request.Query["sort"].ToString();
    // Convert "-created_at" → "createdAt desc"

    return new GridifyQuery {
        Filter = string.Join(",", filters),
        OrderBy = convertedSort,
        Page = int.Parse(request.Query["page"] ?? "1"),
        PageSize = int.Parse(request.Query["per_page"] ?? "15")
    };
}
```

**Decision**: Use **Gridify native syntax**. Update the frontend `use-api-pagination` hook once to use Gridify's format. Since the hook encapsulates all pagination/filtering logic and is used exclusively across all features, this is a single change that propagates everywhere. No PHP compatibility adapter needed.

**Custom filters (like FiltersNeedle for JSON search):**
```csharp
// Register custom Gridify filter for TranslatableString columns
public class TranslatableSearchFilter : IGridifyFiltering<Challenge>
{
    public IQueryable<Challenge> ApplyFiltering(IQueryable<Challenge> query, string value)
    {
        // PostgreSQL: column::text ILIKE '%value%'
        return query.Where(c =>
            EF.Functions.ILike(EF.Property<string>(c, "Title"), $"%{value}%"));
    }
}
```

---

## 6. Patterns to Adopt from eShop

### 6A. Domain Events (Critical for Evaluations & AI Triage)

Add to `BaseEntity`:
```csharp
private List<INotification>? _domainEvents;
public IReadOnlyCollection<INotification>? DomainEvents => _domainEvents?.AsReadOnly();
public void AddDomainEvent(INotification eventItem) { ... }
public void ClearDomainEvents() { ... }
```

Add `MediatorExtension.DispatchDomainEventsAsync()` in Infrastructure. Override `SaveChangesAsync` in `AppDbContext` to dispatch before save.

### 6B. TransactionBehavior

New `TransactionBehavior<TRequest, TResponse>` that wraps `ICommand<T>` handlers in a DB transaction. Dispatches domain events within the transaction.

### 6C. IAggregateRoot Marker

Simple marker interface for entities that are aggregate roots (Ideas, EvaluationSessions). Repositories only for aggregates; keep `IAppDbContext` for simple CRUD.

### 6D. ErrorOr Integration

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

## 7. PHP Feature Porting: Spatie Package Equivalents

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

## 8. Implementation Sequencing

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

## 9. Verification

- `dotnet build` after each phase
- `dotnet test` after test project setup
- Verify Challenges feature still works after BaseEntity changes (additive)
- Test API via Scalar UI (replacing Swagger)
- Verify Aspire `dotnet run --project src/Innovation.AppHost` starts all services
- Integration tests with Testcontainers for database operations
