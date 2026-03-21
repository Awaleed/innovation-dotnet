# .NET API Response Design for 85+ Models

## Decision: Flat DTOs + Conventions + Type Generation

No envelope. No `attributes`/`meta`/`relationships` nesting. Flat records with conventions.

Frontend adaptation is a one-time cost per feature during the port (already touching every file for route changes).

---

## 1. Response Record Conventions

Every model gets **2-3 response records** depending on complexity:

```
{Model}ListResponse    — list/card views (lean, always projected)
{Model}DetailResponse  — detail/show views (full data, includes relations)
{Model}EditResponse    — edit forms only (includes translations as objects)
```

### Why 2-3 records per model, not 1

| Approach | Boilerplate | Performance | Clarity |
|----------|-------------|-------------|---------|
| Single DTO with nullable everything | Low | Bad (over-fetching) | Bad (what's included?) |
| 2-3 purpose-built records | Medium | Best (exact SQL) | Best (explicit contract) |
| Dynamic projection (runtime) | Low | Medium | Bad (no compile-time safety) |

---

## 2. Shared Building Blocks

### TranslatedField (for edit forms)
```csharp
public record TranslatedField(string? En, string? Ar);
```

### PaginatedResponse (replaces SimpleCollection)
```csharp
public record PaginatedResponse<T>(
    List<T> Items, int Page, int PageSize,
    int TotalCount, int TotalPages)
{
    public bool HasNextPage => Page < TotalPages;
    public bool HasPreviousPage => Page > 1;
}
```

### Shared sub-responses (reused across features)
```csharp
public record SelectOption(int Value, string Label);
public record CategoryResponse(int Id, string Name);
public record InnovationTypeResponse(int Id, string Name, string? Icon);
public record LookupResponse(int Id, string Name, string? Description, bool IsActive);
```

---

## 3. Projection Pattern

**List queries**: Project directly in EF LINQ → compiles to SQL, no entity materialization.
**Detail queries**: Load entity with Include, then map via extension method.
**Edit queries**: Load entity, map to EditResponse with TranslatedField properties.

---

## 4. Gridify Setup (one mapper per entity)

```csharp
public class ChallengeGridifyMapper : GridifyMapper<Challenge>
{
    public ChallengeGridifyMapper()
    {
        AddMap("title", c => c.Title.En);
        AddMap("status", c => c.Status);
        AddMap("featured", c => c.Featured);
        AddMap("createdAt", c => c.CreatedAt);
    }
}
```

---

## 5. TypeScript Type Generation

Types auto-generated from C# records via Reinforced.Typings at build time.

**Configuration**: `Web/Typings/ReinforcedTypingsConfiguration.cs`
**Output**: `ClientApp/src/types/generated.ts`

All types ending in `Response`, `Dto`, or shared types are exported. Frontend imports directly:

```typescript
import type { IChallengeListResponse } from '@/types/generated';
```

---

## 6. File Structure Per Feature

```
Application/Features/{Feature}/
  Commands/
    Create{Feature}.cs
    Update{Feature}.cs
    Delete{Feature}.cs
  Queries/
    List{Features}.cs       ← EF projection, Gridify
    Get{Feature}.cs          ← Include + map
  Models/
    {Feature}ListResponse.cs
    {Feature}DetailResponse.cs
    {Feature}EditResponse.cs
  Filters/
    {Feature}GridifyMapper.cs
  Mappings/
    {Feature}Mappings.cs
```

---

## 7. Rules Summary

| Rule | Detail |
|------|--------|
| **Flat DTOs** | No envelope. `challenge.title` not `challenge.attributes.title` |
| **2-3 records per model** | List (projected), Detail (full), Edit (translations) |
| **List = projection** | Always `Select(c => new ListResponse(...))` — compiles to SQL |
| **Detail = Include + map** | Load entity with relations, then extension method |
| **Edit = translations exposed** | `TranslatedField(En, Ar)` for form binding |
| **Gridify mapper per entity** | Declares allowed filters/sorts, prevents injection |
| **Shared sub-responses** | `CategoryResponse`, `SelectOption`, etc. reused everywhere |
| **Dates as ISO strings** | `ToString("o")` for timestamps, `ToString("yyyy-MM-dd")` for dates |
| **Types auto-generated** | Reinforced.Typings → `generated.ts` on build |
