using Infrastructure;
using LinqToDB;
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

builder.Services.AddOpenApiDocument();

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

app.UseOpenApi(); 
app.UseSwaggerUi();
app.MapControllers();

app.Run();
