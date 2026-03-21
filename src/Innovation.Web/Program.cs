using InertiaCore;
using InertiaCore.Extensions;
using Innovation.Application;
using Innovation.Infrastructure;
using Innovation.Infrastructure.Data;
using Innovation.Infrastructure.Data.Interceptors;
using Innovation.ServiceDefaults;
using Innovation.Web.Endpoints;
using Innovation.Web.Extensions;
using Innovation.Web.Middleware;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.AddRedisDistributedCache("redis");

// Application + Infrastructure layers
builder.Services.AddApplication();
builder.Services.AddInfrastructure();

// EF Core with PostgreSQL via Aspire
builder.Services.AddDbContext<AppDbContext>((sp, options) =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("innovationdb") ?? "Host=localhost;Database=innovation;");
    options.AddInterceptors(
        sp.GetRequiredService<AuditableInterceptor>(),
        sp.GetRequiredService<SoftDeleteInterceptor>());
});

builder.Services.AddHttpClient();
builder.Services.AddProblemDetails();
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});
builder.Services.AddControllersWithViews()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

builder.Services.AddInertia(options =>
{
    options.RootView = "~/Views/App.cshtml";
});

builder.Services.AddViteHelper(options =>
{
    options.PublicDirectory = "wwwroot";
    options.BuildDirectory = "build";
    options.ManifestFilename = "manifest.json";
    options.HotFile = "hot";
});

builder.AddKeycloakAuth();
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

app.UseStaticFiles();
app.UseInertia();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<HandleInertiaRequests>();

app.MapControllers();
app.MapChallengeEndpoints();
app.MapAuthEndpoints();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.WithTitle("Innovation Platform API");
    });
}

app.Run();
