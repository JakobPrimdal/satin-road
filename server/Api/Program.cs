using DefaultNamespace;
using Infrastructure;
using Infrastructure.Entities;
using LinqToDB;
using Service;

var builder = WebApplication.CreateBuilder(args);

var connectionString = "Data Source=db.db";
var options = new DataOptions().UseSQLite(connectionString);

var productDbOptions = new DataOptions<ProductDb>(options);
var orderDbOptions = new DataOptions<OrderDb>(options);

builder.Services.AddScoped<ProductService>();
builder.Services.AddScoped<OrderService>();

builder.Services.AddScoped<ProductDb>(_ => new ProductDb(productDbOptions));
builder.Services.AddScoped<OrderDb>(_ => new OrderDb(orderDbOptions));

builder.Services.AddOpenApiDocument();
builder.Services.AddControllers();
builder.Services.AddCors();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var productDb = scope.ServiceProvider.GetRequiredService<ProductDb>();
    productDb.CreateTable<Product>(tableOptions: TableOptions.CreateIfNotExists);
    productDb.CreateTable<ProductImage>(tableOptions: TableOptions.CreateIfNotExists);

    var orderDb = scope.ServiceProvider.GetRequiredService<OrderDb>();
    orderDb.CreateTable<CustomerOrder>(tableOptions: TableOptions.CreateIfNotExists);
    orderDb.CreateTable<OrderProduct>(tableOptions: TableOptions.CreateIfNotExists);
}

app.UseCors(config => config.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin().SetIsOriginAllowed(_ => true));
app.UseOpenApi();
app.UseSwaggerUi();

app.MapControllers();

app.Run();