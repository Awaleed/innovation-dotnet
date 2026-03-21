using System.Threading.RateLimiting;
using FluentValidation;
using InertiaCore;
using InertiaCore.Extensions;
using Innovation.Application;
using Innovation.Application.Common.Exceptions;
using Innovation.Infrastructure;
using Innovation.Infrastructure.Data;
using Innovation.Infrastructure.Data.Interceptors;
using Innovation.ServiceDefaults;
using Innovation.Web.Endpoints;
using Innovation.Web.Extensions;
using Innovation.Web.Middleware;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.AddRedisDistributedCache("redis");

// Application + Infrastructure layers
builder.Services.AddApplication();
builder.Services.AddInfrastructure();

// EF Core with PostgreSQL via Aspire
builder.Services.AddDbContext<AppDbContext>(
    (sp, options) =>
    {
        options.UseNpgsql(
            builder.Configuration.GetConnectionString("innovationdb")
                ?? "Host=localhost;Database=innovation;"
        );
        options.AddInterceptors(
            sp.GetRequiredService<AuditableInterceptor>(),
            sp.GetRequiredService<SoftDeleteInterceptor>()
        );
    }
);

builder.Services.AddHttpClient();
builder.Services.AddProblemDetails();
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(
        new System.Text.Json.Serialization.JsonStringEnumConverter()
    );
});
builder
    .Services.AddControllersWithViews()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter()
        );
    });

builder.Services.AddInertia(options =>
{
    options.RootView = "~/Views/App.cshtml";
});

builder.Services.AddViteHelper(options =>
{
    options.PublicDirectory = "wwwroot";
    options.BuildDirectory = "build";
    options.ManifestFilename = ".vite/manifest.json";
    options.HotFile = "hot";
});

builder.AddKeycloakAuth();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy(
        "api",
        httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: httpContext.User.Identity?.Name
                    ?? httpContext.Connection.RemoteIpAddress?.ToString()
                    ?? "anonymous",
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 60,
                    Window = TimeSpan.FromMinutes(1),
                }
            )
    );
});
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-XSRF-TOKEN";
    options.Cookie.Name = "XSRF-TOKEN";
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
});
builder.Services.AddTransient<HandleInertiaRequests>();
builder.Services.AddOpenApiWithAuth(builder.Configuration);

var app = builder.Build();

// Auto-apply EF Core migrations on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}

app.MapDefaultEndpoints();

// Global exception handler — maps domain exceptions to ProblemDetails
app.UseExceptionHandler(exceptionApp =>
{
    exceptionApp.Run(async context =>
    {
        context.Response.ContentType = "application/problem+json";
        var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
        var (statusCode, title) = exception switch
        {
            ValidationException => (400, "Validation Failed"),
            NotFoundException => (404, "Not Found"),
            BusinessRuleException => (422, "Business Rule Violation"),
            _ => (500, "Internal Server Error"),
        };
        context.Response.StatusCode = statusCode;
        await context.Response.WriteAsJsonAsync(new { status = statusCode, title });
    });
});

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}
app.UseHttpsRedirection();
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseStaticFiles();
app.UseInertia();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.UseAntiforgery();
app.UseRateLimiter();
app.UseMiddleware<HandleInertiaRequests>();

app.MapControllers();
app.MapAntiforgeryEndpoints();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.WithTitle("Innovation Platform API");
    });
}

app.Run();
