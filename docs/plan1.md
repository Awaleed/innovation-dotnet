# Innovation-dotnet vs eShop: Architecture Comparison & Porting Strategy

## Context

The innovation-dotnet project is a .NET port of a large PHP Laravel innovation management platform (75+ models, 40+ enums, 6 modules). Only the **Challenges** feature has been ported so far. This plan compares the current architecture against Microsoft's eShop reference application to validate patterns and identify improvements needed to port the remaining PHP features (Ideas, Evaluations, AI Screening, Forecasting, etc.).

---

## 1. What innovation-dotnet Does WELL (Validated by eShop)

| Pattern | innovation-dotnet | eShop | Verdict |
|---|---|---|---|
| **CQRS with MediatR** | `ICommand<T>` / `IQuery<T>` markers + pipeline behaviors | Raw `IRequest<T>` + same behaviors | **Your approach is cleaner** -- marker interfaces enable selective behavior application |
| **Vertical slice organization** | Co-located command/handler/validator/DTO per feature | Separated into `Commands/`, `Validations/`, `Queries/` folders | **Your approach is more cohesive** for a monolith |
| **Manual mapping (no AutoMapper)** | Extension methods (`ToListResponse()`, `ToDetailResponse()`) | LINQ projections in query classes | Both valid -- yours is more reusable |
| **FluentValidation pipeline** | `ValidationBehavior` in `Application/Behaviors/` | `ValidatorBehavior` -- nearly identical | Aligned |
| **EF Core interceptors** | `AuditableInterceptor`, `SoftDeleteInterceptor` | Not used (domain events instead) | Valid -- interceptors are more transparent for cross-cutting concerns |
| **TranslatableString value object** | `OwnsOne().ToJson()` for en/ar | `Address` as owned entity | Good domain-specific design |
| **Result\<T\> pattern** | `Success/Failure/NotFound` | Not used (throws exceptions) | Yours is safer for CQRS handlers |
| **PaginatedList\<T\>** | `CreateAsync()` with IQueryable | Simple `PaginatedItems` DTO | Yours is more functional |
| **Aspire orchestration** | Redis, PostgreSQL, Keycloak, OpenLDAP, Vite | Redis, PostgreSQL, RabbitMQ, Keycloak | Aligned |
| **ULID for public IDs** | Dual `int Id` + `string PublicUlid` | `int Id` only | Good for API security |

---

## 2. Valid Divergences (Keep As-Is)

- **`IAppDbContext` vs Repository pattern**: Your direct DbContext exposure is simpler and fits vertical slices. eShop uses repositories because its aggregates have complex loading logic. **Keep for simple CRUD; add repositories only for complex aggregates later.**
- **Public setters on entities**: Pragmatic for data-entry-heavy entities like Challenge. For state-machine entities (Evaluations, Ideas), adopt encapsulated properties with behavior methods.
- **Single Web project**: Valid for monolith. CLAUDE.md already flags the ~30 endpoint threshold for splitting.
- **Soft deletes**: eShop doesn't use them. You need them for audit compliance -- keep.

---

## 3. Patterns to ADOPT from eShop

### 3A. Domain Events

**Why**: The PHP platform has complex workflows triggered by state changes (stage advancement triggers notifications, evaluator assignment, AI triage). Without domain events, handlers become bloated with side effects.

**eShop pattern**: `Entity` base class has `AddDomainEvent()` / `ClearDomainEvents()`. Events dispatched in `SaveEntitiesAsync()` via `MediatorExtension.DispatchDomainEventsAsync()`.

**Changes needed**:
- `Domain/BaseEntity.cs` -- add `_domainEvents` list, `AddDomainEvent()`, `ClearDomainEvents()`
- `Infrastructure/MediatorExtension.cs` -- dispatch events from ChangeTracker before save
- `Infrastructure/Data/AppDbContext.cs` -- call dispatch in `SaveChangesAsync` override

### 3B. TransactionBehavior

**Why**: Multi-step commands (create idea + trigger AI triage, submit evaluation + recalculate scores) need transactional consistency.

**eShop pattern**: `TransactionBehavior<TRequest, TResponse>` wraps commands in a DB transaction, dispatches domain events within it.

**Changes needed**:
- `Application/Behaviors/TransactionBehavior.cs` -- apply only to `ICommand<T>` requests
- Register in `Application/DependencyInjection.cs`

### 3C. Integration Events (Async Processing)

**Why**: PHP uses Laravel queues for AI triage jobs, embedding generation, notifications. Need equivalent async processing.

**eShop pattern**: Outbox pattern with `IntegrationEventLogEF`, published via RabbitMQ after transaction commit.

**Approach**: Start simple with `IEventBus` abstraction + .NET `BackgroundService` with `Channel<T>`. Upgrade to RabbitMQ via Aspire later.

Key integration events needed:
- `IdeaSubmittedIntegrationEvent` -> AI triage pipeline
- `IdeaEmbeddingRequestedIntegrationEvent` -> embedding generation
- `EvaluationCompletedIntegrationEvent` -> score aggregation
- `ChallengeStageAdvancedIntegrationEvent` -> bulk notifications

### 3D. Testing Infrastructure

**eShop pattern**: MSTest + NSubstitute, static endpoint methods testable without HTTP, `[Feature]Services` parameter objects.

**Changes needed**:
- Create `tests/Innovation.UnitTests/` project
- Add NSubstitute package
- Make endpoint methods static with `[AsParameters]` service classes
- Test domain logic (state machines, validation) and handler logic (mocked DbContext)

### 3E. API Versioning

**eShop pattern**: `Asp.Versioning.Http` with `NewVersionedApi()`.

**Change**: Replace manual `/api/v1/` URL prefix with formal `Asp.Versioning` package. Low priority.

---

## 4. Porting Strategy for Remaining PHP Features

### 4A. Ideas Module (Port Second -- Core Feature)

PHP has `Idea` model with 30+ fields, 20+ relationships, media collections, embeddings, AI evaluations.

```
Domain/Entities/Idea/
  Idea.cs                     -- aggregate root with rich behavior for status transitions
  IdeaTeamMember.cs
  IdeaStep.cs
  IdeaEvaluator.cs
  IdeaEmbedding.cs            -- Vector property (pgvector)

Application/Features/Ideas/
  SubmitIdea.cs               -- raises IdeaSubmittedDomainEvent
  ListIdeas.cs, GetIdea.cs, UpdateIdea.cs, DeleteIdea.cs
  AssignEvaluators.cs
  AdvanceIdeaStage.cs         -- raises IdeaStageAdvancedDomainEvent
  Shared/IdeaMapping.cs, IdeaResponse.cs
  DomainEventHandlers/
    IdeaSubmittedHandler.cs   -- triggers AI triage via integration event
```

### 4B. Evaluations Module (Most Complex -- Port Third)

Maps to eShop's `Order` aggregate in complexity. Follow the rich domain model pattern.

```
Domain/Entities/Evaluation/
  EvaluationStage.cs          -- aggregate root
  EvaluationFactor.cs, EvaluationFactorItem.cs
  EvaluationTemplate.cs       -- aggregate root

Domain/Entities/Assessment/
  EvaluationSession.cs        -- aggregate root (private setters, behavior methods)
  EvaluationAssessmentValue.cs
  EvaluationResult.cs         -- computed scores
```

`EvaluationSession` should follow eShop's `Order` pattern: `StartSession()`, `SubmitAssessment()`, `CompleteSession()` methods raising domain events.

### 4C. AI Screening Module (Port Fourth -- Depends on Ideas)

Follow eShop's `CatalogAI` pattern for AI integration.

```
Application/Common/Interfaces/
  IInnovationAI.cs            -- IsEnabled, GetEmbeddingAsync, EvaluateIdeaAsync

Application/Features/AIScreening/
  TriageIdea.cs               -- orchestrates the pipeline
  Services/IIdeaTriageService.cs with pipe stages

Infrastructure/Services/AI/
  InnovationAI.cs             -- uses Microsoft.Extensions.AI (IChatClient, IEmbeddingGenerator)
```

Use `Pgvector.EntityFrameworkCore` for vector columns (same as eShop).

### 4D. Forecasting/Radar Module (Port Fifth -- Independent)

Simpler structure following established patterns.

```
Domain/Entities/Forecasting/
  ForecastingRadar.cs, ForecastingTrend.cs, ForecastingSignal.cs

Application/Features/Forecasting/
  CreateRadar.cs, ListRadars.cs, PublishRadar.cs, etc.
```

### 4E. Supporting Features (Port Alongside)

| PHP Feature | .NET Approach |
|---|---|
| **Comments** | Simple CRUD feature, polymorphic via `CommentableType`/`CommentableId` |
| **Attachments/Media** | `IMediaService` interface + `MediaItem` entity. Local disk initially, Azure Blob later. Use `ImageSharp` for conversions |
| **Announcements** | Simple CRUD feature |
| **Tags** | `Tag` + `Taggable` polymorphic entities |
| **Activity Log** | `ActivityLogInterceptor` recording field-level changes from `ChangeTracker` |
| **Notifications** | `INotificationService` + `Notification` entity + SignalR hub for real-time |
| **Permissions** | Keycloak realm roles mapped to ASP.NET Core authorization policies |
| **Settings** | `IOptions<T>` with custom `ISettingsProvider` backed by DB |
| **Queues** | Integration events via `IEventBus` + `BackgroundService` |

---

## 5. Implementation Sequencing

### Phase 1: Foundation (Before New Features)
1. Add domain event support to `BaseEntity` (follow eShop `Entity.cs`)
2. Add `MediatorExtension.DispatchDomainEventsAsync()` in Infrastructure
3. Add `TransactionBehavior` to Application behaviors
4. Add `IAggregateRoot` marker interface
5. Add `IMediaService` interface + local implementation
6. Add `INotificationService` interface + `Notification` entity
7. Add `IEventBus` abstraction + in-process `BackgroundService` implementation
8. Set up `tests/Innovation.UnitTests/` with NSubstitute

### Phase 2: Ideas
Port `Idea` aggregate, CRUD handlers, media upload, domain events

### Phase 3: Evaluations
Port evaluation stages, factors, templates, sessions with rich domain model

### Phase 4: AI Screening
Port AI service using `Microsoft.Extensions.AI`, triage pipeline, pgvector embeddings

### Phase 5: Forecasting, Comments, Announcements, Permissions
Port remaining features using established patterns

---

## 6. Verification

- Run `dotnet build` after each phase to ensure compilation
- Run unit tests after adding test project
- Test Challenges feature still works after BaseEntity/DbContext changes (domain events are additive)
- Test new features via Swagger UI and Inertia pages
- Verify Aspire orchestration starts all services correctly

---

## Key Files to Modify (Phase 1 Foundation)

| File | Change |
|---|---|
| `src/Innovation.Domain/BaseEntity.cs` | Add domain event support |
| `src/Innovation.Infrastructure/Data/AppDbContext.cs` | Override SaveChangesAsync to dispatch domain events |
| `src/Innovation.Infrastructure/MediatorExtension.cs` | New -- dispatch events from ChangeTracker |
| `src/Innovation.Application/Behaviors/TransactionBehavior.cs` | New -- wrap commands in DB transaction |
| `src/Innovation.Application/DependencyInjection.cs` | Register TransactionBehavior |
| `src/Innovation.Application/Common/Interfaces/IMediaService.cs` | New -- media abstraction |
| `src/Innovation.Application/Common/Interfaces/INotificationService.cs` | New -- notification abstraction |
| `src/Innovation.Application/Common/Interfaces/IEventBus.cs` | New -- integration event bus |
