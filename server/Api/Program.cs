using Infrastructure;
using Infrastructure.Entities;
using LinqToDB;
using Service;

var builder = WebApplication.CreateBuilder(args);

var connectionString = "Data Source=db.db";
var options = new DataOptions().UseSQLite(connectionString);
var dataOptions = new DataOptions<ProductDb>(options);
builder.Services.AddScoped<ProductService>();
builder.Services.AddScoped<ProductDb>(_ => new ProductDb(dataOptions));
builder.Services.AddOpenApiDocument();
builder.Services.AddControllers();
builder.Services.AddCors();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ProductDb>();
    db.CreateTable<Product>(tableOptions: TableOptions.CreateIfNotExists);
    db.CreateTable<ProductImage>(tableOptions: TableOptions.CreateIfNotExists);
}

app.UseCors(config => config.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin().SetIsOriginAllowed(_ => true));
app.UseOpenApi();
app.UseSwaggerUi();

app.MapControllers();

app.Run();