using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Infrastructure;
using LinqToDB;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using NSwag;
using NSwag.Generation.Processors.Security;
using Service;

var builder = WebApplication.CreateBuilder(args);

//  database settings
var options = new DataOptions<MyDbConnection>(
    new DataOptions().UseSQLite("Data Source=db.db"));

builder.Services.AddScoped<MyDbConnection>(_ =>
    new MyDbConnection(options));

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

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MyDbConnection>();


    db.CreateTable<User>(tableOptions: TableOptions.CreateIfNotExists);
   
}

app.UseExceptionHandler();
app.UseCors(config => config
    .AllowAnyHeader()
    .AllowAnyMethod()
    .SetIsOriginAllowed(_ => true));

app.UseAuthentication();  
app.UseAuthorization(); 

app.UseOpenApi(); 
app.UseSwaggerUi();
app.MapControllers();

app.Run();
