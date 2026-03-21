# License Management Server — Architecture & Design

## Overview

A cloud-hosted .NET license server that your on-prem Innovation app phones home to periodically. Feature-based licensing with tenant isolation that works across multi-server deployments.

## Key Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| License identity | **Tenant (organization)** — not machine/device | Survives multi-server, container restarts, VM migrations |
| License format | **RSA-signed JWT** cached locally | Verifiable offline during grace period, tamper-proof |
| Validation | **Phone-home every 24h** | Balance between control and uptime |
| Feature model | **Module flags + tier** | Matches your Innovation platform modules |
| Multi-server | **Tenant key shared across all instances** | No per-machine binding — same org, same license |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  YOUR CLOUD                          │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │         License Server (ASP.NET API)          │   │
│  │                                                │   │
│  │  POST /api/licenses/validate                   │   │
│  │  GET  /api/licenses/{key}/features             │   │
│  │  POST /api/licenses/heartbeat                  │   │
│  │                                                │   │
│  │  Admin Panel:                                  │   │
│  │  GET  /admin/tenants                           │   │
│  │  POST /admin/tenants/{id}/licenses             │   │
│  │  PUT  /admin/licenses/{id}/features            │   │
│  │  POST /admin/licenses/{id}/revoke              │   │
│  │                                                │   │
│  └──────────────┬───────────────────────────────┘   │
│                 │                                    │
│  ┌──────────────┴───────────────────────────────┐   │
│  │         PostgreSQL (License Data)              │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
                        │
                    HTTPS (TLS)
                        │
┌─────────────────────────────────────────────────────┐
│              CUSTOMER ON-PREM (multi-server)         │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │  App Server 1 │  │  App Server 2 │  ...           │
│  │               │  │               │                │
│  │  LicenseSDK   │  │  LicenseSDK   │                │
│  │  (cached JWT) │  │  (cached JWT) │                │
│  └──────────────┘  └──────────────┘                 │
│                                                      │
│  All servers share the same license key.             │
│  Each validates independently against your cloud.    │
│  If cloud is unreachable, cached JWT is valid        │
│  for a grace period (e.g., 7 days).                  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## Database Schema

```sql
-- Tenants (your customers / organizations)
CREATE TABLE tenants (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    contact_email   VARCHAR(255),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    metadata        JSONB,              -- extra info (address, industry, etc.)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- License keys issued to tenants
CREATE TABLE licenses (
    id              SERIAL PRIMARY KEY,
    tenant_id       INT NOT NULL REFERENCES tenants(id),
    license_key     VARCHAR(64) NOT NULL UNIQUE,  -- e.g., "INN-XXXX-XXXX-XXXX"
    tier            VARCHAR(50) NOT NULL,          -- 'starter', 'professional', 'enterprise'
    max_users       INT,                           -- NULL = unlimited
    starts_at       TIMESTAMPTZ NOT NULL,
    expires_at      TIMESTAMPTZ,                   -- NULL = perpetual
    is_revoked      BOOLEAN NOT NULL DEFAULT false,
    revoked_at      TIMESTAMPTZ,
    revoke_reason   VARCHAR(500),
    grace_days      INT NOT NULL DEFAULT 7,        -- offline grace period
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_licenses_key ON licenses(license_key);
CREATE INDEX idx_licenses_tenant ON licenses(tenant_id);

-- Feature flags per license
CREATE TABLE license_features (
    id              SERIAL PRIMARY KEY,
    license_id      INT NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
    feature_code    VARCHAR(100) NOT NULL,    -- e.g., 'challenges', 'ai_screening', 'evaluations'
    is_enabled      BOOLEAN NOT NULL DEFAULT true,
    max_usage       INT,                      -- NULL = unlimited, or cap (e.g., 100 AI screens/month)
    metadata        JSONB,                    -- extra config per feature
    UNIQUE(license_id, feature_code)
);

-- Validation log (every phone-home is recorded)
CREATE TABLE license_validations (
    id              SERIAL PRIMARY KEY,
    license_id      INT NOT NULL REFERENCES licenses(id),
    validated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    client_ip       INET,
    app_version     VARCHAR(50),
    server_id       VARCHAR(255),             -- identifies which server in multi-server setup
    user_count      INT,                      -- reported active users
    result          VARCHAR(20) NOT NULL,     -- 'valid', 'expired', 'revoked', 'over_limit'
    metadata        JSONB
);

-- Partition validations by month for performance
-- CREATE TABLE license_validations_2026_01 PARTITION OF license_validations
--     FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Feature catalog (defines all available features)
CREATE TABLE feature_catalog (
    code            VARCHAR(100) PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    module          VARCHAR(100),             -- grouping: 'core', 'ai', 'evaluation', 'reporting'
    sort_order      INT NOT NULL DEFAULT 0
);

-- Seed feature catalog
INSERT INTO feature_catalog (code, name, module, sort_order) VALUES
    ('challenges',       'Challenges Module',          'core',       1),
    ('ideas',            'Ideas Module',               'core',       2),
    ('evaluations',      'Evaluations Module',         'evaluation', 3),
    ('ai_screening',     'AI Screening & Triage',      'ai',         4),
    ('ai_embeddings',    'AI Vector Search',           'ai',         5),
    ('reports_basic',    'Basic Reports',              'reporting',  6),
    ('reports_advanced', 'Advanced Analytics',          'reporting',  7),
    ('forecasting',      'Innovation Forecasting',      'reporting',  8),
    ('comments',         'Comments & Discussions',      'core',       9),
    ('notifications',    'Real-time Notifications',     'core',      10),
    ('export_excel',     'Excel Export',               'reporting',  11),
    ('export_pdf',       'PDF Export',                 'reporting',  12),
    ('audit_log',        'Audit Logging',              'core',       13),
    ('api_access',       'External API Access',        'integration',14);

-- Tier templates (quick-assign features by tier)
CREATE TABLE tier_templates (
    id              SERIAL PRIMARY KEY,
    tier            VARCHAR(50) NOT NULL,
    feature_code    VARCHAR(100) NOT NULL REFERENCES feature_catalog(code),
    is_enabled      BOOLEAN NOT NULL DEFAULT true,
    max_usage       INT,
    UNIQUE(tier, feature_code)
);

-- Seed tier templates
-- Starter: core only
INSERT INTO tier_templates (tier, feature_code) VALUES
    ('starter', 'challenges'),
    ('starter', 'ideas'),
    ('starter', 'comments'),
    ('starter', 'notifications'),
    ('starter', 'reports_basic');

-- Professional: core + evaluation + basic AI + exports
INSERT INTO tier_templates (tier, feature_code) VALUES
    ('professional', 'challenges'),
    ('professional', 'ideas'),
    ('professional', 'evaluations'),
    ('professional', 'ai_screening'),
    ('professional', 'comments'),
    ('professional', 'notifications'),
    ('professional', 'reports_basic'),
    ('professional', 'reports_advanced'),
    ('professional', 'export_excel'),
    ('professional', 'export_pdf'),
    ('professional', 'audit_log');

-- Enterprise: everything
INSERT INTO tier_templates (tier, feature_code) VALUES
    ('enterprise', 'challenges'),
    ('enterprise', 'ideas'),
    ('enterprise', 'evaluations'),
    ('enterprise', 'ai_screening'),
    ('enterprise', 'ai_embeddings'),
    ('enterprise', 'comments'),
    ('enterprise', 'notifications'),
    ('enterprise', 'reports_basic'),
    ('enterprise', 'reports_advanced'),
    ('enterprise', 'forecasting'),
    ('enterprise', 'export_excel'),
    ('enterprise', 'export_pdf'),
    ('enterprise', 'audit_log'),
    ('enterprise', 'api_access');
```

---

## License Server API

### RSA Key Pair (generate once, store securely)

```csharp
// Generate once during setup — store private key in Azure Key Vault or server config
// Ship ONLY the public key with your on-prem app

using var rsa = RSA.Create(2048);
var privateKey = rsa.ExportRSAPrivateKeyPem();  // keep on license server ONLY
var publicKey = rsa.ExportRSAPublicKeyPem();    // embed in client SDK
```

### License Token (JWT) Structure

```json
{
  "iss": "https://license.yourdomain.com",
  "sub": "INN-ABCD-1234-EFGH",         // license key
  "tid": "42",                           // tenant ID
  "tn": "Acme Corp",                     // tenant name
  "tier": "professional",
  "iat": 1711000000,
  "exp": 1711086400,                     // 24h from issue
  "grc": 1711604800,                     // grace expiry (7 days)
  "mxu": 50,                            // max users (null = unlimited)
  "features": {
    "challenges": true,
    "ideas": true,
    "evaluations": true,
    "ai_screening": { "enabled": true, "maxUsage": 500 },
    "reports_basic": true,
    "reports_advanced": true,
    "export_excel": true,
    "export_pdf": true,
    "audit_log": true
  }
}
```

### Validation Endpoint

```csharp
// POST /api/licenses/validate
// Called by on-prem app every 24h (or on startup)

public record ValidateRequest(
    string LicenseKey,
    string? AppVersion,
    string? ServerId,      // e.g., machine name or container ID
    int? ActiveUserCount
);

public record ValidateResponse(
    bool IsValid,
    string? Token,          // RSA-signed JWT — cache this on-prem
    string? Tier,
    DateTime? ExpiresAt,
    DateTime? GraceExpiresAt,
    Dictionary<string, FeatureStatus>? Features,
    string? Error           // 'expired', 'revoked', 'over_user_limit', 'not_found'
);

public record FeatureStatus(bool Enabled, int? MaxUsage = null);

app.MapPost("/api/licenses/validate", async (
    ValidateRequest request,
    LicenseDbContext db,
    ITokenService tokenService,
    HttpContext http) =>
{
    var license = await db.Licenses
        .Include(l => l.Features)
        .Include(l => l.Tenant)
        .FirstOrDefaultAsync(l => l.LicenseKey == request.LicenseKey);

    if (license is null)
        return Results.Ok(new ValidateResponse(false, null, null, null, null, null, "not_found"));

    if (license.IsRevoked)
        return Results.Ok(new ValidateResponse(false, null, null, null, null, null, "revoked"));

    if (license.ExpiresAt.HasValue && license.ExpiresAt < DateTime.UtcNow)
        return Results.Ok(new ValidateResponse(false, null, null, null, null, null, "expired"));

    if (!license.Tenant.IsActive)
        return Results.Ok(new ValidateResponse(false, null, null, null, null, null, "tenant_disabled"));

    if (license.MaxUsers.HasValue && request.ActiveUserCount > license.MaxUsers)
        return Results.Ok(new ValidateResponse(false, null, null, null, null, null, "over_user_limit"));

    // Generate signed token
    var token = tokenService.GenerateLicenseToken(license);

    // Log validation
    db.LicenseValidations.Add(new LicenseValidation
    {
        LicenseId = license.Id,
        ClientIp = http.Connection.RemoteIpAddress,
        AppVersion = request.AppVersion,
        ServerId = request.ServerId,
        UserCount = request.ActiveUserCount,
        Result = "valid"
    });
    await db.SaveChangesAsync();

    var features = license.Features.ToDictionary(
        f => f.FeatureCode,
        f => new FeatureStatus(f.IsEnabled, f.MaxUsage)
    );

    return Results.Ok(new ValidateResponse(
        true,
        token,
        license.Tier,
        license.ExpiresAt,
        DateTime.UtcNow.AddDays(license.GraceDays),
        features,
        null
    ));
});
```

### Token Generation Service

```csharp
public class TokenService : ITokenService
{
    private readonly RSA _rsa;
    private readonly string _issuer;

    public TokenService(IConfiguration config)
    {
        _rsa = RSA.Create();
        _rsa.ImportFromPem(config["License:PrivateKeyPem"]);
        _issuer = config["License:Issuer"]!; // "https://license.yourdomain.com"
    }

    public string GenerateLicenseToken(License license)
    {
        var signingCredentials = new SigningCredentials(
            new RsaSecurityKey(_rsa), SecurityAlgorithms.RsaSha256);

        var features = license.Features
            .Where(f => f.IsEnabled)
            .ToDictionary(f => f.FeatureCode, f => f.MaxUsage.HasValue
                ? (object)new { enabled = true, maxUsage = f.MaxUsage }
                : (object)true);

        var claims = new List<Claim>
        {
            new("tid", license.TenantId.ToString()),
            new("tn", license.Tenant.Name),
            new("tier", license.Tier),
            new("grc", new DateTimeOffset(
                DateTime.UtcNow.AddDays(license.GraceDays)).ToUnixTimeSeconds().ToString()),
            new("features", JsonSerializer.Serialize(features)),
        };

        if (license.MaxUsers.HasValue)
            claims.Add(new Claim("mxu", license.MaxUsers.Value.ToString()));

        var token = new JwtSecurityToken(
            issuer: _issuer,
            subject: license.LicenseKey,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: signingCredentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

---

## Client SDK (embedded in your on-prem Innovation app)

### NuGet Package Structure

```
Innovation.Licensing/
    LicenseClient.cs        — phone-home + cache logic
    LicenseInfo.cs           — parsed license state
    LicenseFeatureGuard.cs   — middleware / attribute for feature checks
    ILicenseProvider.cs      — interface for DI
```

### LicenseClient (core)

```csharp
// Innovation.Licensing/LicenseClient.cs
public class LicenseClient : ILicenseProvider, IHostedService
{
    private readonly HttpClient _http;
    private readonly string _licenseKey;
    private readonly string _serverUrl;
    private readonly RSA _publicKey;
    private readonly string _cacheFilePath;
    private readonly ILogger<LicenseClient> _logger;
    private LicenseInfo? _current;
    private Timer? _timer;

    public LicenseClient(IConfiguration config, IHttpClientFactory httpFactory,
        ILogger<LicenseClient> logger)
    {
        _http = httpFactory.CreateClient("LicenseServer");
        _licenseKey = config["License:Key"]!;
        _serverUrl = config["License:ServerUrl"]!;
        _cacheFilePath = config["License:CachePath"] ?? "license.cache";
        _logger = logger;

        // Load PUBLIC key only — private key never leaves your cloud
        _publicKey = RSA.Create();
        _publicKey.ImportFromPem(config["License:PublicKeyPem"]);
    }

    public LicenseInfo? Current => _current;

    public bool HasFeature(string featureCode)
        => _current?.Features.TryGetValue(featureCode, out var f) == true && f.Enabled;

    public async Task StartAsync(CancellationToken ct)
    {
        // Try loading cached token first (for fast startup)
        LoadCachedToken();

        // Validate immediately
        await ValidateAsync();

        // Then every 24 hours
        _timer = new Timer(_ => _ = ValidateAsync(), null,
            TimeSpan.FromHours(24), TimeSpan.FromHours(24));
    }

    public Task StopAsync(CancellationToken ct)
    {
        _timer?.Dispose();
        return Task.CompletedTask;
    }

    private async Task ValidateAsync()
    {
        try
        {
            var request = new
            {
                licenseKey = _licenseKey,
                appVersion = Assembly.GetEntryAssembly()?.GetName().Version?.ToString(),
                serverId = Environment.MachineName,
                activeUserCount = (int?)null // you can report this from your user session store
            };

            var response = await _http.PostAsJsonAsync($"{_serverUrl}/api/licenses/validate", request);
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<ValidateResponse>();

            if (result is { IsValid: true, Token: not null })
            {
                _current = ParseAndVerifyToken(result.Token);
                CacheToken(result.Token);
                _logger.LogInformation("License validated. Tier: {Tier}, Features: {Count}",
                    _current.Tier, _current.Features.Count);
            }
            else
            {
                _logger.LogWarning("License validation failed: {Error}", result?.Error);

                // If we have a cached token in grace period, keep using it
                if (_current is null || !_current.IsInGracePeriod)
                {
                    _current = _current with { IsValid = false, Error = result?.Error };
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to reach license server. Using cached license.");

            // Offline — cached token still valid if within grace period
            if (_current is not null && !_current.IsInGracePeriod)
            {
                _logger.LogError("License grace period expired. App will run in restricted mode.");
                _current = _current with { IsValid = false, Error = "grace_expired" };
            }
        }
    }

    private LicenseInfo ParseAndVerifyToken(string token)
    {
        var handler = new JwtSecurityTokenHandler();
        var validationParams = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = _serverUrl,
            ValidateAudience = false,
            ValidateLifetime = false, // we handle grace period ourselves
            IssuerSigningKey = new RsaSecurityKey(_publicKey),
            ValidateIssuerSigningKey = true,
        };

        var principal = handler.ValidateToken(token, validationParams, out var validatedToken);
        var jwt = (JwtSecurityToken)validatedToken;

        var features = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(
            jwt.Claims.First(c => c.Type == "features").Value) ?? [];

        var parsed = new Dictionary<string, FeatureStatus>();
        foreach (var (key, val) in features)
        {
            if (val.ValueKind == JsonValueKind.True)
                parsed[key] = new FeatureStatus(true);
            else if (val.ValueKind == JsonValueKind.Object)
                parsed[key] = new FeatureStatus(
                    val.GetProperty("enabled").GetBoolean(),
                    val.TryGetProperty("maxUsage", out var mu) ? mu.GetInt32() : null);
        }

        var graceEpoch = long.Parse(jwt.Claims.First(c => c.Type == "grc").Value);
        var graceExpiry = DateTimeOffset.FromUnixTimeSeconds(graceEpoch).UtcDateTime;

        return new LicenseInfo
        {
            IsValid = true,
            LicenseKey = jwt.Subject,
            TenantId = jwt.Claims.First(c => c.Type == "tid").Value,
            TenantName = jwt.Claims.First(c => c.Type == "tn").Value,
            Tier = jwt.Claims.First(c => c.Type == "tier").Value,
            MaxUsers = jwt.Claims.FirstOrDefault(c => c.Type == "mxu")?.Value is string m
                ? int.Parse(m) : null,
            TokenExpiry = jwt.ValidTo,
            GraceExpiry = graceExpiry,
            Features = parsed,
        };
    }

    private void CacheToken(string token)
    {
        try { File.WriteAllText(_cacheFilePath, token); }
        catch (Exception ex) { _logger.LogWarning(ex, "Failed to cache license token"); }
    }

    private void LoadCachedToken()
    {
        try
        {
            if (!File.Exists(_cacheFilePath)) return;
            var token = File.ReadAllText(_cacheFilePath);
            _current = ParseAndVerifyToken(token);
            _logger.LogInformation("Loaded cached license. Grace until: {Grace}", _current.GraceExpiry);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to load cached license");
        }
    }
}
```

### LicenseInfo

```csharp
public record LicenseInfo
{
    public bool IsValid { get; init; }
    public string? Error { get; init; }
    public string LicenseKey { get; init; } = "";
    public string TenantId { get; init; } = "";
    public string TenantName { get; init; } = "";
    public string Tier { get; init; } = "";
    public int? MaxUsers { get; init; }
    public DateTime TokenExpiry { get; init; }
    public DateTime GraceExpiry { get; init; }
    public Dictionary<string, FeatureStatus> Features { get; init; } = [];

    public bool IsExpired => TokenExpiry < DateTime.UtcNow;
    public bool IsInGracePeriod => IsExpired && GraceExpiry > DateTime.UtcNow;
}

public record FeatureStatus(bool Enabled, int? MaxUsage = null);
```

### Feature Guard (use in your Innovation app)

```csharp
// Middleware — block entire endpoints
public class RequireLicenseFeatureAttribute : Attribute, IAsyncActionFilter
{
    private readonly string _featureCode;
    public RequireLicenseFeatureAttribute(string featureCode) => _featureCode = featureCode;

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var license = context.HttpContext.RequestServices.GetRequiredService<ILicenseProvider>();

        if (!license.HasFeature(_featureCode))
        {
            context.Result = new ObjectResult(new { error = "feature_not_licensed", feature = _featureCode })
            {
                StatusCode = 403
            };
            return;
        }

        await next();
    }
}

// Usage on endpoints
app.MapGet("/api/v1/challenges", [RequireLicenseFeature("challenges")] async (...) => { ... });
app.MapPost("/api/v1/ai/screen",  [RequireLicenseFeature("ai_screening")] async (...) => { ... });

// Usage in handlers (via DI)
public class ScreenIdeaHandler(ILicenseProvider license) : ICommandHandler<ScreenIdea.Command, ErrorOr<...>>
{
    public async Task<ErrorOr<...>> Handle(ScreenIdea.Command request, CancellationToken ct)
    {
        if (!license.HasFeature("ai_screening"))
            return Error.Forbidden("License.FeatureNotLicensed", "AI Screening is not included in your plan.");

        // proceed...
    }
}

// Usage in frontend (expose via Inertia shared data)
// HandleInertiaRequests.cs
public class HandleInertiaRequests : IMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var license = context.RequestServices.GetRequiredService<ILicenseProvider>();
        var current = license.Current;

        Inertia.Share("license", new
        {
            tier = current?.Tier,
            features = current?.Features.ToDictionary(
                f => f.Key,
                f => f.Value.Enabled
            ) ?? new Dictionary<string, bool>(),
            isValid = current?.IsValid ?? false,
        });

        await next(context);
    }
}
```

### Frontend Feature Guard (React)

```tsx
// hooks/use-license.ts
import { usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';

export function useLicense() {
    const { license } = usePage<SharedData>().props;

    return {
        tier: license?.tier ?? 'none',
        isValid: license?.isValid ?? false,
        hasFeature: (code: string) => license?.features?.[code] === true,
    };
}

// components/feature-gate.tsx
export function FeatureGate({
    feature,
    children,
    fallback = null
}: {
    feature: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}) {
    const { hasFeature } = useLicense();

    if (!hasFeature(feature)) return fallback;
    return <>{children}</>;
}

// Usage in pages
<FeatureGate feature="ai_screening">
    <AIScreeningPanel />
</FeatureGate>

<FeatureGate feature="export_pdf" fallback={<UpgradeBanner />}>
    <ExportPDFButton />
</FeatureGate>

// Usage in navigation (hide menu items)
{hasFeature('evaluations') && (
    <NavItem href={admin.evaluations.index.url()} label="Evaluations" />
)}
```

---

## Registration in Innovation App (DI)

```csharp
// Program.cs or DependencyInjection.cs
builder.Services.AddHttpClient("LicenseServer", client =>
{
    client.Timeout = TimeSpan.FromSeconds(10);
});

builder.Services.AddSingleton<LicenseClient>();
builder.Services.AddSingleton<ILicenseProvider>(sp => sp.GetRequiredService<LicenseClient>());
builder.Services.AddHostedService(sp => sp.GetRequiredService<LicenseClient>());
```

### App Configuration (appsettings.json)

```jsonc
{
  "License": {
    "Key": "INN-ABCD-1234-EFGH",
    "ServerUrl": "https://license.yourdomain.com",
    "CachePath": "./data/license.cache",
    "PublicKeyPem": "-----BEGIN PUBLIC KEY-----\nMIIBI...\n-----END PUBLIC KEY-----"
  }
}
```

---

## Multi-Server Deployment — Why This Works

The license is tied to the **license key** (organization-level), NOT to a machine.

```
Customer: Acme Corp
License Key: INN-ABCD-1234-EFGH
Tier: Professional

  Server A (web) ──────→ Validates with same key ──→ Gets same JWT ──→ Caches locally
  Server B (web) ──────→ Validates with same key ──→ Gets same JWT ──→ Caches locally
  Server C (worker) ───→ Validates with same key ──→ Gets same JWT ──→ Caches locally
```

Each server validates independently on its own 24h cycle. If one server can't reach your cloud, its cached JWT is valid for the grace period. No coordination between servers needed.

If you want to track WHICH servers are running (for analytics, not enforcement):
- The `ServerId` field in the validation request captures `Environment.MachineName`
- The validation log shows all active servers per tenant
- You can alert if a license key appears from unexpected IPs/servers

---

## Admin API (for your admin panel to manage licenses)

```csharp
// Create license for a tenant (auto-populate features from tier template)
app.MapPost("/admin/tenants/{tenantId}/licenses", async (
    int tenantId,
    CreateLicenseRequest request,
    LicenseDbContext db) =>
{
    var key = GenerateLicenseKey(); // "INN-XXXX-XXXX-XXXX"

    var license = new License
    {
        TenantId = tenantId,
        LicenseKey = key,
        Tier = request.Tier,
        MaxUsers = request.MaxUsers,
        StartsAt = request.StartsAt ?? DateTime.UtcNow,
        ExpiresAt = request.ExpiresAt,
        GraceDays = request.GraceDays ?? 7,
    };

    // Auto-populate features from tier template
    var template = await db.TierTemplates
        .Where(t => t.Tier == request.Tier)
        .ToListAsync();

    license.Features = template.Select(t => new LicenseFeature
    {
        FeatureCode = t.FeatureCode,
        IsEnabled = t.IsEnabled,
        MaxUsage = t.MaxUsage,
    }).ToList();

    db.Licenses.Add(license);
    await db.SaveChangesAsync();

    return Results.Created($"/admin/licenses/{license.Id}", new { license.Id, license.LicenseKey });
});

// Toggle individual feature on a license (override tier defaults)
app.MapPut("/admin/licenses/{licenseId}/features/{featureCode}", async (
    int licenseId,
    string featureCode,
    UpdateFeatureRequest request,
    LicenseDbContext db) =>
{
    var feature = await db.LicenseFeatures
        .FirstOrDefaultAsync(f => f.LicenseId == licenseId && f.FeatureCode == featureCode);

    if (feature is null)
    {
        feature = new LicenseFeature
        {
            LicenseId = licenseId,
            FeatureCode = featureCode,
        };
        db.LicenseFeatures.Add(feature);
    }

    feature.IsEnabled = request.IsEnabled;
    feature.MaxUsage = request.MaxUsage;
    await db.SaveChangesAsync();

    return Results.Ok();
});

// Revoke a license
app.MapPost("/admin/licenses/{id}/revoke", async (int id, RevokeRequest request, LicenseDbContext db) =>
{
    var license = await db.Licenses.FindAsync(id);
    if (license is null) return Results.NotFound();

    license.IsRevoked = true;
    license.RevokedAt = DateTime.UtcNow;
    license.RevokeReason = request.Reason;
    await db.SaveChangesAsync();

    return Results.Ok();
    // Next time the on-prem app phones home, it will get "revoked" status
    // After grace period expires, the cached token becomes invalid
});

// Helper
static string GenerateLicenseKey()
{
    var bytes = RandomNumberGenerator.GetBytes(12);
    var hex = Convert.ToHexString(bytes);
    return $"INN-{hex[..4]}-{hex[4..8]}-{hex[8..12]}";
}
```

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| Token tampering | RSA signature — only your server can sign, client verifies with public key |
| Token sharing between customers | License key is logged with IP and server ID — detectable in validation logs |
| Bypassing feature checks | Feature guard is in server middleware, not just frontend |
| Offline abuse | Grace period (default 7 days), then app enters restricted mode |
| Key extraction from binary | Public key is fine to extract — can't forge tokens without private key |
| Replay attacks | Token expires every 24h, new one issued on each validation |
| HTTPS interception | Standard TLS — use certificate pinning if paranoid |
| License key brute force | Rate limiting on validation endpoint + key format has high entropy |

---

## Feature Code Constants (shared between server and client SDK)

```csharp
// Innovation.Licensing/Features.cs
public static class LicenseFeatures
{
    public const string Challenges = "challenges";
    public const string Ideas = "ideas";
    public const string Evaluations = "evaluations";
    public const string AIScreening = "ai_screening";
    public const string AIEmbeddings = "ai_embeddings";
    public const string ReportsBasic = "reports_basic";
    public const string ReportsAdvanced = "reports_advanced";
    public const string Forecasting = "forecasting";
    public const string Comments = "comments";
    public const string Notifications = "notifications";
    public const string ExportExcel = "export_excel";
    public const string ExportPDF = "export_pdf";
    public const string AuditLog = "audit_log";
    public const string ApiAccess = "api_access";
}

// Usage — no magic strings
[RequireLicenseFeature(LicenseFeatures.AIScreening)]
app.MapPost("/api/v1/ai/screen", ...);
```
