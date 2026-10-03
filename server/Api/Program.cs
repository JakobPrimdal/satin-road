using DefaultNamespace;
using Api;
using Service;
using Infrastructure;
using Infrastructure.Entities;
using LinqToDB;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using NSwag;
using NSwag.Generation.Processors.Security;

var builder = WebApplication.CreateBuilder(args);

// ---------- database ----------
var connectionString = "Data Source=db.db;Foreign Keys=True";
var options = new DataOptions().UseSQLite(connectionString);

var userDbOptions = new DataOptions<MyDbConnection>(options);
var productDbOptions = new DataOptions<ProductDb>(options);
var orderDbOptions = new DataOptions<OrderDb>(options);

builder.Services.AddScoped<MyDbConnection>(_ => new MyDbConnection(userDbOptions));
builder.Services.AddScoped<ProductDb>(_ => new ProductDb(productDbOptions));
builder.Services.AddScoped<OrderDb>(_ => new OrderDb(orderDbOptions));

builder.Services.AddScoped<ProductService>();
builder.Services.AddScoped<OrderService>();
builder.Services.AddScoped<AuthService>();

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

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MyDbConnection>();
    db.CreateTable<User>(tableOptions: TableOptions.CreateIfNotExists);

    var adminUsername = builder.Configuration["Admin:Username"] ?? "admin";
    var adminPassword = builder.Configuration["Admin:Password"]
                        ?? throw new InvalidOperationException("Admin:Password is not configured");
    var auth = scope.ServiceProvider.GetRequiredService<AuthService>();
    await auth.SeedAdmin(adminUsername, adminPassword);

    var productDb = scope.ServiceProvider.GetRequiredService<ProductDb>();
    productDb.CreateTable<Product>(tableOptions: TableOptions.CreateIfNotExists);
    productDb.CreateTable<ProductImage>(tableOptions: TableOptions.CreateIfNotExists);

    var orderDb = scope.ServiceProvider.GetRequiredService<OrderDb>();
    orderDb.CreateTable<CustomerOrder>(tableOptions: TableOptions.CreateIfNotExists);
    orderDb.CreateTable<OrderProduct>(tableOptions: TableOptions.CreateIfNotExists);
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