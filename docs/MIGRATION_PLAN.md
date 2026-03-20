# Plan: Port Innovation Platform from Laravel to .NET 10 (Vertical Slice Architecture)

## Context

The source project (`/Users/mac/Documents/GitHub/innovation/`) is a production-grade Laravel 12 + React 19 innovation management platform with **77+ Eloquent models**, **112 migrations**, **7 feature modules**, and complex domain logic (evaluation workflows, jury voting, AI screening, forecasting). The target project (`/Users/mac/Documents/GitHub/innovation-dotnet/`) is an early-stage .NET 10 app with infrastructure already in place (Keycloak auth, Aspire orchestration, Inertia.js + React frontend, MediatR, FluentValidation) but **no domain entities, DbContext, or business logic** yet. This plan covers the complete port using Vertical Slice Architecture.

---

## Part 1: Architecture Overview

### Vertical Slice Architecture (VSA) Principles
- **Organize by feature, not by technical layer** -- no separate Controllers/Services/Repositories folders
- Each feature is a self-contained slice: `Command/Query` + `Handler` + `Validator` + `Endpoint`
- Cross-cutting concerns handled via MediatR pipeline behaviors
- Domain entities live in `Innovation.Domain`
- Feature slices live in `Innovation.Application/Features/`
- Feature-local shared logic lives in `Features/{Domain}/Shared/`

### 4-Project Architecture
```
Dependency flow: Web -> Infrastructure -> Application -> Domain

src/
  Innovation.Domain/            -- Entities, enums, value objects, interfaces (zero deps)
  Innovation.Application/       -- Features/slices, MediatR handlers, validators, behaviors
  Innovation.Infrastructure/    -- AppDbContext, EF configurations, interceptors, seeders
  Innovation.Web/               -- Composition root: Program.cs, endpoints, controllers, middleware
  Innovation.AppHost/           -- Aspire orchestrator (PostgreSQL, Redis, Keycloak, LDAP, Vite)
  Innovation.ServiceDefaults/   -- OpenTelemetry, health checks, resilience
  Innovation.TsGen/             -- C# -> TypeScript route generator
  Innovation.KeycloakTheme/     -- Custom Keycloak login theme
```

**Key design choice:** `Innovation.Application` defines `IAppDbContext` (interface with DbSet properties). `Innovation.Infrastructure` implements it with `AppDbContext`. This avoids circular dependencies while allowing handlers to use DbContext directly (VSA style).

---

## Part 2: Folder Structure

### `Innovation.Domain/` -- Domain Kernel (zero dependencies)
```
Innovation.Domain/
  BaseEntity.cs                     (exists -- Id, CreatedAt, UpdatedAt, DeletedAt, IsDeleted)
  TranslatableString.cs             (exists -- En/Ar JSON value object)
  Interfaces/
    ISoftDeletable.cs
    ISortable.cs
    ILikeable.cs, ICommentable.cs, IBookmarkable.cs
  Enums/                            (port all 43 Laravel enums)
    ChallengeStatus.cs              (exists)
    IdeaStatus.cs, ProjectStage.cs, ProjectType.cs,
    ChallengeDifficulty.cs, ChallengeParticipationType.cs,
    EvaluationStageStatus.cs, EvaluationFactorType.cs,
    TrendStatus.cs, TrendMaturity.cs, RadarQuadrant.cs,
    WinnerSelectionMethod.cs, AnnouncementType.cs, ...
  Entities/
    User.cs, UserProfile.cs, UserSpecialty.cs
    Challenge/
      Challenge.cs, ChallengeAward.cs, ChallengeGroup.cs,
      ChallengeObjective.cs, ChallengeRequirement.cs, ChallengeRisk.cs,
      ChallengeSponsor.cs, ChallengeTimeline.cs, ChallengeWinner.cs,
      ChallengeSustainabilityImpact.cs, ChallengeIntellectualProperty.cs,
      ChallengeUser.cs (pivot)
    Idea/
      Idea.cs, IdeaStep.cs, IdeaTeamMember.cs, IdeaEvaluator.cs,
      IdeaEmbedding.cs, IdeaPipelineStatus.cs, IdeaFolder.cs,
      IdeaMethodology.cs (pivot)
    Evaluation/
      EvaluationTemplate.cs, EvaluationStage.cs, EvaluationFactor.cs,
      EvaluationFactorItem.cs, EvaluationFactorStage.cs (pivot),
      TemplateStage.cs (pivot), EvaluationResult.cs, EvaluationSession.cs,
      EvaluationAssessmentValue.cs, EvaluationAssessmentRecommendation.cs,
      EvaluatorPerformance.cs
    Voting/
      JuryVotingSession.cs, JuryVote.cs
    AI/
      AIEvaluation.cs, AICriterion.cs, AICriterionScore.cs,
      AIIdeaInsight.cs, LLMConfig.cs, EmbeddingModelConfig.cs
    Forecasting/
      ForecastingTrend.cs, ForecastingSignal.cs, ForecastingRadar.cs,
      ForecastingTrendEmbedding.cs, ForecastingTrendEvaluation.cs,
      MarketOpportunity.cs, OpportunityHypothesis.cs
    Project/
      Project.cs, ProjectKpi.cs, ProjectStageData.cs,
      ProjectStageHistory.cs, ProjectTeamMember.cs, ProjectTool.cs
    Engagement/
      Like.cs, Comment.cs, Bookmark.cs, Announcement.cs, Attachment.cs
    Lookup/
      Lookup.cs, InnovationType.cs, InnovationMethodology.cs
    Settings/
      StageNotificationSetting.cs, IssueReport.cs
```

### `Innovation.Application/` -- Features & Business Logic (depends on Domain)
```
Innovation.Application/
  Common/
    Interfaces/
      IAppDbContext.cs              (DbSet properties + SaveChangesAsync)
      ICommand.cs                   (ICommand<T> : IRequest<T>)
      IQuery.cs                     (IQuery<T> : IRequest<T>)
      ICurrentUserService.cs
    Models/
      Result.cs                     (Result<T> pattern for handler returns)
      PaginatedList.cs
      PagedRequest.cs
    Extensions/
      ChallengeStatusExtensions.cs  (rich enum behaviors)
      IdeaStatusExtensions.cs
    Exceptions/
      NotFoundException.cs, ForbiddenException.cs, BusinessRuleException.cs

  Behaviors/                        (MediatR pipeline)
    ValidationBehavior.cs
    LoggingBehavior.cs
    TransactionBehavior.cs
    PerformanceBehavior.cs

  Features/                         (VERTICAL SLICES)
    Challenges/
      CreateChallenge.cs            (Command + Validator + Handler in one file)
      UpdateChallenge.cs
      GetChallenge.cs
      ListChallenges.cs
      DeleteChallenge.cs
      AdvanceChallengeStage.cs
      Shared/ -> ChallengeResponse.cs, ChallengeMapping.cs

    Ideas/
      CreateIdea.cs, UpdateIdea.cs, GetIdea.cs, ListIdeas.cs,
      DeleteIdea.cs, SubmitIdea.cs, ManageIdeaTeam.cs, ManageIdeaFolders.cs

    Evaluation/
      Configuration/ -> CreateTemplate.cs, CreateStage.cs, CreateFactor.cs, ...
      Assignment/    -> AssignEvaluator.cs, RemoveEvaluator.cs, ListAssignments.cs
      Workflow/      -> SubmitAssessment.cs, CompleteEvaluation.cs
      Monitoring/    -> GetEvaluationDashboard.cs, GetEvaluatorPerformance.cs
      Reporting/     -> GetEvaluationReport.cs

    Voting/
      StartVotingSession.cs, SubmitVote.cs, CloseVotingSession.cs,
      CalculateResults.cs, GetVotingProgress.cs
      Shared/ -> VotingResultCalculator.cs, IdeaScoringCalculator.cs

    Winners/
      SelectWinners.cs, AnnounceWinners.cs, GetLeaderboard.cs

    Projects/
      CreateProject.cs, GetProject.cs, ListProjects.cs, TransitionStage.cs, ManageKpis.cs

    AIScreening/
      TriggerAIEvaluation.cs, GetAIEvaluation.cs, ManageAICriteria.cs,
      GenerateEmbeddings.cs, ManageLLMConfigs.cs

    Forecasting/
      CreateTrend.cs, ListTrends.cs, ManageSignals.cs, ManageRadars.cs,
      ManageOpportunities.cs, GenerateChallengeFromTrend.cs

    Users/
      ListUsers.cs, GetUser.cs, UpdateUser.cs, ManageRoles.cs

    Engagement/
      ToggleLike.cs, CreateComment.cs, ToggleBookmark.cs

    Announcements/
      CreateAnnouncement.cs, PublishAnnouncement.cs, ListAnnouncements.cs

    Dashboard/
      GetAdminDashboard.cs, GetUserDashboard.cs

    Reports/
      GenerateInnovationReport.cs

    Settings/
      ManageNotificationSettings.cs

  DependencyInjection.cs            (AddApplication extension method)
```

### `Innovation.Infrastructure/` -- Data & External Services (depends on Domain + Application)
```
Innovation.Infrastructure/
  Data/
    AppDbContext.cs                  (implements IAppDbContext, 70+ DbSets, pgVector, query filters)
    Configurations/                 (one IEntityTypeConfiguration<T> per entity)
    Interceptors/
      SoftDeleteInterceptor.cs      (convert DELETE -> UPDATE DeletedAt)
      AuditableInterceptor.cs       (auto-set CreatedAt/UpdatedAt)
    Seeders/
      AppDbContextSeeder.cs
      RolesAndPermissionsSeeder.cs
      LookupSeeder.cs
      EvaluationSystemSeeder.cs
    Migrations/
  Services/                         (external service implementations)
    CurrentUserService.cs
    MediaService.cs
    ActivityLogService.cs
    TagService.cs
  DependencyInjection.cs            (AddInfrastructure extension method)
```

### `Innovation.Web/` -- Composition Root (depends on all)
```
Innovation.Web/
  Program.cs                        (DI composition root, middleware pipeline)
  Endpoints/                        (Minimal API endpoint mappings)
    ChallengeEndpoints.cs
    IdeaEndpoints.cs
    ...
  Controllers/                      (thin Inertia controllers -- page rendering only)
    Admin/   -> ChallengeController, IdeaController, ProjectController, ...
    User/    -> IdeaController, ChallengeController, ProfileController
    Evaluator/ -> AssignmentController, AssessmentController
  Middleware/
    HandleInertiaRequests.cs        (exists)
    LocalizationMiddleware.cs
  Hubs/
    NotificationHub.cs
```

---

## Part 3: NuGet Packages

### Packages to ADD to `Directory.Packages.props`

| Package | Version | Replaces (Laravel) |
|---------|---------|-------------------|
| `Hangfire.Core` | 1.8.20 | Redis queue + Horizon |
| `Hangfire.AspNetCore` | 1.8.20 | |
| `Hangfire.Redis.StackExchange` | 1.9.4 | |
| `Microsoft.AspNetCore.SignalR.StackExchangeRedis` | 10.0.1 | Ably broadcasting |
| `Pgvector` | 0.3.0 | pgvector PHP |
| `Pgvector.EntityFrameworkCore` | 0.3.0 | |
| `Azure.AI.OpenAI` | 2.2.0 | openai-php/client |
| `SixLabors.ImageSharp` | 3.1.7 | Intervention Image |
| `SixLabors.ImageSharp.Web` | 3.1.3 | |
| `ClosedXML` | 0.105.0 | maatwebsite/excel |
| `QuestPDF` | 2025.3.2 | jsPDF / phpoffice |
| `DocumentFormat.OpenXml` | 3.3.0 | phpoffice/phpword+phppresentation |
| `Asp.Versioning.Http` | 8.1.0 | (new) API versioning |
| `Asp.Versioning.Mvc.ApiExplorer` | 8.1.0 | |

### Packages ALREADY configured (no changes needed)
MediatR 13.0, FluentValidation 12.0, Npgsql.EFCore.PostgreSQL 10.0, AspNetCore.InertiaCore 0.0.9, Reinforced.Typings 1.6.7, all Aspire packages, OpenTelemetry, Scalar.AspNetCore, JWT, Identity.EFCore

### Install Commands
```bash
# Run from solution root
cd /Users/mac/Documents/GitHub/innovation-dotnet

# Background jobs
dotnet add src/Innovation.Web package Hangfire.Core
dotnet add src/Innovation.Web package Hangfire.AspNetCore
dotnet add src/Innovation.Web package Hangfire.Redis.StackExchange

# Real-time
dotnet add src/Innovation.Web package Microsoft.AspNetCore.SignalR.StackExchangeRedis

# pgVector
dotnet add src/Innovation.Web package Pgvector
dotnet add src/Innovation.Web package Pgvector.EntityFrameworkCore

# AI
dotnet add src/Innovation.Web package Azure.AI.OpenAI

# Image processing
dotnet add src/Innovation.Web package SixLabors.ImageSharp
dotnet add src/Innovation.Web package SixLabors.ImageSharp.Web

# Documents
dotnet add src/Innovation.Web package ClosedXML
dotnet add src/Innovation.Web package QuestPDF
dotnet add src/Innovation.Web package DocumentFormat.OpenXml

# API versioning
dotnet add src/Innovation.Web package Asp.Versioning.Http
dotnet add src/Innovation.Web package Asp.Versioning.Mvc.ApiExplorer
```

---

## Part 4: Key Architectural Decisions

### 1. Entity Location
- **Domain entities** in `Innovation.Domain/Entities/` (referenced by TsGen for TypeScript codegen)
- **Feature slices** in `Innovation.Application/Features/`
- **EF configurations** in `Innovation.Infrastructure/Data/Configurations/`
- **API endpoints** in `Innovation.Web/Endpoints/`
- `Innovation.Application` defines `IAppDbContext` interface; `Innovation.Infrastructure` implements it

### 2. TranslatableString as Owned JSON Type
Every Laravel translatable field (`title`, `description`, `slug`, etc.) maps to a `TranslatableString` owned type:
```csharp
// Entity
public TranslatableString Title { get; set; } = new();

// Configuration
builder.OwnsOne(c => c.Title, b => b.ToJson());
```

### 3. Polymorphic Relationships (Likes, Comments, Bookmarks)
Use string discriminator columns matching Laravel's morphTo pattern:
```csharp
public class Like : BaseEntity {
    public string LikeableType { get; set; }  // "challenge", "idea"
    public int LikeableId { get; set; }
    public int UserId { get; set; }
    public bool IsLike { get; set; }
}
```
Per-parent navigation configured via query filters in EF configuration.

### 4. Many-to-Many with Pivot Data
Explicit join entities for all M2M with extra columns: `ChallengeUser` (role, status), `TemplateStage` (is_required, order_index), `EvaluationFactorStage` (weight, order_index), etc.

### 5. Soft Deletes
- `SoftDeleteInterceptor` intercepts `EntityState.Deleted` -> converts to `Modified` with `DeletedAt = DateTime.UtcNow`
- Global query filter: `builder.HasQueryFilter(e => e.DeletedAt == null)` applied by convention to all `BaseEntity` descendants
- Bypass with `.IgnoreQueryFilters()` for admin restore operations

### 6. RBAC
Hybrid approach: Keycloak realm roles (admin, user, evaluator) + PostgreSQL permission tables matching Spatie schema for fine-grained control. Custom `AuthorizationBehavior<TRequest, TResponse>` in MediatR pipeline.

### 7. Thin Controllers + Thick Handlers
Controllers are Inertia renderers only. They call `Inertia.Render("Page", props)` for page loads and `_mediator.Send(command)` for API calls. All business logic in MediatR handlers.

### 8. Result Pattern
Handlers return `Result<T>` for expected business outcomes instead of throwing exceptions. Exceptions reserved for infrastructure errors.

### 9. Migration Strategy
Single initial EF Core migration matching the full Laravel schema (not 112 incremental migrations). Data can be migrated via `pg_dump`/`pg_restore` since both use PostgreSQL.

---

## Part 5: MediatR Pipeline Setup

Registration order in `Program.cs`:
```
1. LoggingBehavior       -- structured logging of all requests
2. PerformanceBehavior   -- warns if handler > 500ms
3. ValidationBehavior    -- FluentValidation (throws before handler)
4. TransactionBehavior   -- wraps commands in DB transaction
5. Handler               -- actual business logic
```

CQRS marker interfaces:
```csharp
public interface ICommand<out TResponse> : IRequest<TResponse> { }
public interface IQuery<out TResponse> : IRequest<TResponse> { }
```

---

## Part 6: Cross-Cutting Concern Mappings

| Laravel (Spatie) | .NET Implementation |
|-----------------|-------------------|
| `spatie/laravel-permission` | Custom EF entities + `AuthorizationBehavior` + Redis cache |
| `spatie/laravel-medialibrary` | Custom `MediaItem` entity + `IMediaService` + ImageSharp |
| `spatie/laravel-activitylog` | `AuditInterceptor` (SaveChanges) + `ActivityLog` entity |
| `spatie/laravel-tags` | Custom `Tag`/`Taggable` entities + `ITagService` |
| `spatie/laravel-translatable` | `TranslatableString` owned JSON type (exists) |
| `SoftDeletes` trait | `SoftDeleteInterceptor` + global query filters |
| `SortableTrait` | `ISortable` interface + `OrderColumn` property |
| Laravel Queue/Horizon | Hangfire + Redis storage |
| Laravel Broadcasting | SignalR + Redis backplane |
| Inertia.js (PHP) | InertiaCore 0.0.9 (exists) |

---

## Part 7: EF Core DbContext Configuration

```csharp
public class AppDbContext : DbContext
{
    // 70+ DbSet declarations
    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.HasPostgresExtension("vector");
        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Apply soft delete filters by convention
        foreach (var entityType in builder.Model.GetEntityTypes())
            if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
                entityType.SetQueryFilter(/* DeletedAt == null */);
    }
}
```

Registration via DI extension methods in `Program.cs`:
```csharp
builder.Services.AddApplication();                          // MediatR, FluentValidation, behaviors
builder.Services.AddInfrastructure(builder.Configuration);  // DbContext, interceptors, services
builder.AddNpgsqlDbContext<AppDbContext>("innovationdb");    // Aspire connection
```

---

## Part 8: Implementation Phases

### Phase 1: Foundation (Week 1-2)
1. Add all NuGet packages to `Directory.Packages.props` and `Innovation.Web.csproj`
2. Create `AppDbContext` with Aspire integration
3. Implement `SoftDeleteInterceptor` + `AuditableInterceptor`
4. Create MediatR pipeline behaviors (Validation, Logging, Transaction, Performance)
5. Create `Result<T>`, `PaginatedList<T>`, global exception handler
6. Create `ICurrentUserService` from Keycloak claims
7. Configure Hangfire with Redis
8. Configure SignalR with Redis backplane

### Phase 2: Core Entities (Week 2-3)
9. Port all 43 enums from `app/Enums/`
10. Create `User` + `UserProfile` + `UserSpecialty` entities + configurations
11. Create `Lookup` + `InnovationType` + `InnovationMethodology` entities
12. Implement RBAC entities (Role, Permission) + `AuthorizationBehavior`
13. Implement `IMediaService`, `ITagService`, `IActivityLogService`
14. Create initial EF Core migration
15. Create seeders (Roles, Permissions, Lookups)

### Phase 3: Challenge Domain (Week 3-5)
16. Create `Challenge` entity with all 11 child entities
17. Create `ChallengeUser` pivot entity (mentors, jury, participants)
18. Write EF configurations for all challenge entities
19. Challenge CRUD vertical slices (Create, Get, List, Update, Delete)
20. Challenge stage advancement slice
21. Challenge timeline management slice
22. Challenge awards/sponsors management slices

### Phase 4: Idea Domain (Week 5-7)
23. Create `Idea` entity with all child entities (Step, TeamMember, Folder, Embedding)
24. Create `IdeaEvaluator` join entity
25. Idea CRUD vertical slices
26. Idea submission workflow (status transitions with validation)
27. Idea folder management slices

### Phase 5: Evaluation Domain (Week 7-9)
28. Create all evaluation entities (Template, Stage, Factor, FactorItem, Result, Session, AssessmentValue, Recommendation)
29. Evaluation configuration slices (template/stage/factor CRUD)
30. Evaluator assignment slices
31. Assessment submission workflow slices
32. Evaluation quality calculation logic (completeness, consistency, thoroughness)

### Phase 6: Voting & Winners (Week 9-10)
33. Create `JuryVotingSession` + `JuryVote` entities
34. Port `JuryVotingService` logic -> `VotingResultCalculator.cs` (Borda count, scoring, approval)
35. Port `IdeaScoringService` -> `IdeaScoringCalculator.cs`
36. Voting slices (Start, Submit, Close, Calculate)
37. `ChallengeWinner` entity + winner selection slices
38. Port `WinnerSelectionService` logic into handlers

### Phase 7: Engagement (Week 10-11)
39. Create polymorphic entities (Like, Comment, Bookmark, Announcement, Attachment)
40. Engagement slices (ToggleLike, CreateComment, ToggleBookmark)
41. Announcement slices (Create, Publish, List)

### Phase 8: AI Screening (Week 11-12)
42. Create AI entities (AIEvaluation, AICriterion, AICriterionScore, AIIdeaInsight, LLMConfig)
43. `IdeaEmbedding` with pgVector columns
44. AI evaluation trigger/retrieval slices
45. OpenAI integration service for embeddings + scoring
46. Background job for AI pipeline processing

### Phase 9: Forecasting (Week 12-14)
47. Create forecasting entities (Trend, Signal, Radar, Embeddings, Evaluation, Opportunity, Hypothesis)
48. Forecasting CRUD slices
49. Challenge generation from trend slice
50. Forecasting dashboard slice

### Phase 10: Projects & Remaining (Week 14-16)
51. Create Project entity with children (KPI, StageData, StageHistory, TeamMember, Tool)
52. Project CRUD and stage transition slices
53. Dashboard slices (Admin, User)
54. Settings and notification slices
55. Report generation slices (QuestPDF + OpenXml)

### Phase 11: Integration (Week 16-18)
56. Expand TypeScript codegen (all response types in ReinforcedTypingsConfiguration)
57. Data migration from Laravel PostgreSQL
58. End-to-end testing of all feature slices

---

## Part 9: Critical Source Files Reference

### Laravel Source (what to port FROM)
- `app/Models/` -- 77 model files
- `app/Enums/` -- 43 enum files
- `app/Services/` -- 7 core services (JuryVoting, ChallengeTimeline, IdeaScoring, WinnerSelection, etc.)
- `database/migrations/` -- 112 migrations (schema reference)
- `Modules/Admin/app/Http/Controllers/` -- 67 admin controllers
- `Modules/Evaluator/app/Http/Controllers/` -- 8 evaluator controllers
- `Modules/Forecasting/app/Http/Controllers/` -- 10 forecasting controllers

### .NET Target (4-project architecture)
- `Directory.Packages.props` -- add new packages
- `src/Innovation.Domain/` -- entities, enums, value objects (renamed from Shared)
- `src/Innovation.Application/` -- features/slices, MediatR handlers, behaviors (NEW)
- `src/Innovation.Infrastructure/` -- DbContext, EF configs, interceptors, services (NEW)
- `src/Innovation.Web/Program.cs` -- composition root, endpoints, controllers
- `src/Innovation.AppHost/Program.cs` -- add database resource

---

## Part 10: Verification Plan

### Per-Phase Verification
1. **Foundation**: `dotnet build` succeeds, Aspire dashboard shows all services healthy, Hangfire dashboard accessible at `/hangfire`
2. **Core Entities**: `dotnet ef migrations add` generates clean migration, `dotnet ef database update` creates all tables
3. **Each Feature Domain**: Write and run integration tests per slice, verify via Scalar API docs at `/scalar`, test Inertia page rendering

### End-to-End Verification
1. Start via `dotnet run --project src/Innovation.AppHost` -- all services start
2. Login via Keycloak SSO
3. Create a challenge with all child entities
4. Submit an idea to the challenge
5. Assign evaluators, submit assessments
6. Start jury voting, submit votes, calculate results
7. Select and announce winners
8. Verify real-time notifications via SignalR
9. Export reports (PDF, Excel)
