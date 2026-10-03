using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Infrastructure;
using LinqToDB;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using NSwag;
using NSwag.Generation.Processors.Security;
using Service;

using Api;
using DefaultNamespace;
using Infrastructure;
using Infrastructure.Entities;
using LinqToDB;
using Service;

var builder = WebApplication.CreateBuilder(args);

//  database settings
var connectionString = "Data Source=db.db;Foreign Keys=True";
var options = new DataOptions().UseSQLite(connectionString);

var productDbOptions = new DataOptions<ProductDb>(options);
var orderDbOptions = new DataOptions<OrderDb>(options);

builder.Services.AddScoped<MyDbConnection>(_ =>
    new MyDbConnection(options));

builder.Services.AddScoped<ProductService>();
builder.Services.AddScoped<OrderService>();

builder.Services.AddScoped<ProductDb>(_ => new ProductDb(productDbOptions));
builder.Services.AddScoped<OrderDb>(_ => new OrderDb(orderDbOptions));


builder.Services.AddScoped<AuthService>();

builder.Services.AddControllers();
builder.Services.AddExceptionHandler<MyExceptionHandler>();
builder.Services.AddProblemDetails();
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





builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

builder.Services.AddOpenApiDocument();
builder.Services.AddControllers();
builder.Services.AddCors();


// ---------- JWT ----------
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtSettings>()!;
builder.Services.AddSingleton(jwt);
builder.Services.AddSingleton<TokenService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.MapInboundClaims = false;   // keep claim names exactly as written in TokenService
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

app.UseExceptionHandler();
app.UseCors(config => config
    .AllowAnyHeader()
    .AllowAnyMethod()
    .SetIsOriginAllowed(_ => true));

app.UseOpenApi();
app.UseSwaggerUi();

app.UseAuthentication();  
app.UseAuthorization(); 

app.UseOpenApi(); 
app.UseSwaggerUi();
app.MapControllers();

app.Run();
