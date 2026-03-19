using Innovation.Identity.API;
using Innovation.Identity.API.Data;
using Innovation.Identity.API.Models;
using Innovation.ServiceDefaults;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

builder.AddNpgsqlDbContext<ApplicationDbContext>("identitydb");

// Auto-apply database migrations and seed demo users on startup
builder.Services.AddMigration<ApplicationDbContext, UsersSeed>();

// Built-in Identity API endpoints — provides /register, /login, /refresh, etc.
builder.Services.AddIdentityApiEndpoints<ApplicationUser>(options =>
    {
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireNonAlphanumeric = true;
        options.Password.RequiredLength = 8;
        options.User.RequireUniqueEmail = true;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>();

builder.Services.AddAuthorization();
builder.Services.AddOpenApi();

var app = builder.Build();

app.MapDefaultEndpoints();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseAuthentication();
app.UseAuthorization();

// Built-in Identity endpoints: /register, /login, /refresh, /confirmEmail, etc.
app.MapIdentityApi<ApplicationUser>();

app.Run();
