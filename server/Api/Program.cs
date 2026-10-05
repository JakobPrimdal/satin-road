using DefaultNamespace;
using Api;
using Service;
using Infrastructure;
using Infrastructure.Entities;
using LinqToDB;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using LinqToDB.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using NSwag;
using NSwag.Generation.Processors.Security;

var builder = WebApplication.CreateBuilder(args);

// ---------- database ----------
var connectionString = "Data Source=db.db;Foreign Keys=True";
var options = new DataOptions().UseSQLite(connectionString);

var userDbOptions = new DataOptions<LoginDb>(options);
var productDbOptions = new DataOptions<ProductDb>(options);
var orderDbOptions = new DataOptions<OrderDb>(options);

builder.Services.AddScoped<LoginDb>(_ => new LoginDb(userDbOptions));
builder.Services.AddScoped<ProductDb>(_ => new ProductDb(productDbOptions));
builder.Services.AddScoped<OrderDb>(_ => new OrderDb(orderDbOptions));

builder.Services.AddScoped<ProductService>();
builder.Services.AddScoped<OrderService>();
builder.Services.AddScoped<CategoryService>();
builder.Services.AddScoped<AuthService>();

builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();

// ---------- error handling ----------
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// ---------- controllers / swagger / cors ----------
builder.Services.AddControllers();
builder.Services.AddCors();

builder.Services.AddOpenApiDocument(c =>
{
    c.AddSecurity("JWT", new OpenApiSecurityScheme
    {
        Type = OpenApiSecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });
    c.OperationProcessors.Add(new AspNetCoreOperationSecurityScopeProcessor("JWT"));
});

// ---------- JWT ----------
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtSettings>()!;
builder.Services.AddSingleton(jwt);
builder.Services.AddSingleton<TokenService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.MapInboundClaims = false;
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Audience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret)),
            RoleClaimType = "role",
            NameClaimType = JwtRegisteredClaimNames.UniqueName
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages(); // Let's caller see unauthorized error-dto

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<LoginDb>();
    db.CreateTable<User>(tableOptions: TableOptions.CreateIfNotExists);

    var adminUsername = builder.Configuration["Admin:Username"] ?? "admin";
    var adminPassword = builder.Configuration["Admin:Password"]
                        ?? throw new InvalidOperationException("Admin:Password is not configured");
    var auth = scope.ServiceProvider.GetRequiredService<AuthService>();
    await auth.SeedAdmin(adminUsername, adminPassword);

    var productDb = scope.ServiceProvider.GetRequiredService<ProductDb>();

    productDb.Execute("""
                      CREATE TABLE IF NOT EXISTS [Category]
                      (
                          [Id]   INTEGER       NOT NULL PRIMARY KEY AUTOINCREMENT,
                          [Name] NVarChar(255) NOT NULL UNIQUE
                      );
                      """);
    
    productDb.Execute("""
                      CREATE TABLE IF NOT EXISTS [Product]
                      (
                          [Id]            INTEGER       NOT NULL PRIMARY KEY AUTOINCREMENT,
                          [Title]         NVarChar(255) NOT NULL,
                          [Description]   NVarChar(255) NOT NULL,
                          [Price]         Decimal       NOT NULL,
                          [Stock]         INTEGER       NOT NULL,
                          [CreatedAtUtc]  DateTime2     NOT NULL,
                          [UpdatedAtUtc]  DateTime2     NOT NULL,
                          [CategoryId]    INTEGER       NOT NULL,
                          [VendorId]      NVarChar(255) NOT NULL,
                          [Status]        NVarChar(20)  NOT NULL DEFAULT 'Pending',
                          [IsActive]      INTEGER       NOT NULL DEFAULT 1,
                          FOREIGN KEY ([VendorId]) REFERENCES [User]([UserId]),
                          FOREIGN KEY ([CategoryId]) REFERENCES [Category]([Id])
                      );
                      """);

    productDb.Execute("""
                      CREATE TABLE IF NOT EXISTS [ProductImage]
                      (
                          [Id]        INTEGER       NOT NULL PRIMARY KEY AUTOINCREMENT,
                          [ProductId] INTEGER       NOT NULL,
                          [IsPrimary] Bit           NOT NULL,
                          [SortOrder] INTEGER       NOT NULL,
                          [Extension] NVarChar(255) NOT NULL,
                          [Image]     VarBinary     NOT NULL,
                          FOREIGN KEY ([ProductId]) REFERENCES [Product]([Id]) ON DELETE CASCADE
                      );
                      """);
    
    var orderDb = scope.ServiceProvider.GetRequiredService<OrderDb>();

    orderDb.Execute("""
                    CREATE TABLE IF NOT EXISTS [CustomerOrder]
                    (
                        [Id]             INTEGER       NOT NULL PRIMARY KEY AUTOINCREMENT,
                        [CustomerId]     NVarChar(255) NOT NULL,
                        [PurchasedAtUtc] DateTime2     NOT NULL,
                        FOREIGN KEY ([CustomerId]) REFERENCES [User]([UserId])
                    );
                    """);

    orderDb.Execute("""
                    CREATE TABLE IF NOT EXISTS [OrderProduct]
                    (
                        [Id]                  INTEGER       NOT NULL PRIMARY KEY AUTOINCREMENT,
                        [OrderId]             INTEGER       NOT NULL,
                        [ProductId]           INTEGER       NOT NULL,
                        [VendorId]            NVarChar(255) NOT NULL,
                        [Quantity]            INTEGER       NOT NULL,
                        [UnitPriceAtPurchase] Decimal       NOT NULL,
                        FOREIGN KEY ([OrderId]) REFERENCES [CustomerOrder]([Id]) ON DELETE CASCADE,
                        FOREIGN KEY ([ProductId]) REFERENCES [Product]([Id])
                    );
                    """);
}

app.UseCors(config => config
    .AllowAnyHeader()
    .AllowAnyMethod()
    .SetIsOriginAllowed(_ => true));

app.UseOpenApi();
app.UseSwaggerUi();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();