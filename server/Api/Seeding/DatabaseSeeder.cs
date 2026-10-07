using System.Text.Json;
using Infrastructure;
using Infrastructure.Entities;
using LinqToDB;
using LinqToDB.Data;
using Service;

namespace Api.Seeding;

public static class DatabaseSeeder
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public static void Seed(ProductDb db, IPasswordHasher passwordHasher, string seedDirectory, ILogger logger)
    {
        if (db.Categories().Any() || db.Products().Any())
        {
            logger.LogInformation("Seeding skipped: the database already has categories or products.");
            return;
        }

        var seedFile = Path.Combine(seedDirectory, "seed.json");
        if (!File.Exists(seedFile))
        {
            logger.LogWarning("Seeding skipped: {SeedFile} was not found.", seedFile);
            return;
        }

        var data = JsonSerializer.Deserialize<SeedData>(File.ReadAllText(seedFile), JsonOptions)
                   ?? throw new InvalidOperationException("seed.json is empty.");

        using var transaction = db.BeginTransaction();

        var userIds = SeedUsers(db, passwordHasher, data);
        var categoryIds = SeedCategories(db, data);
        var products = SeedProducts(db, data, userIds, categoryIds, Path.Combine(seedDirectory, "Images"));
        var orderCount = SeedOrders(db, data, userIds, products);

        transaction.Commit();

        logger.LogInformation(
            "Seeded {Users} users, {Categories} categories, {Products} products and {Orders} orders.",
            data.Users.Count, categoryIds.Count, products.Count, orderCount);
    }

    private static Dictionary<string, string> SeedUsers(DataConnection db, IPasswordHasher passwordHasher, SeedData data)
    {
        var userIds = db.GetTable<User>().ToDictionary(u => u.Username, u => u.UserId);

        foreach (var seedUser in data.Users)
        {
            var username = seedUser.Username.Trim().ToLowerInvariant();
            if (userIds.ContainsKey(username)) continue;

            var user = new User
            {
                UserId = Guid.NewGuid().ToString(),
                Username = username,
                PasswordHash = passwordHasher.HashAndSaltPassword(seedUser.Password ?? data.DefaultPassword),
                Role = seedUser.Role ?? Roles.User,
                IsActive = seedUser.IsActive ?? true
            };

            db.Insert(user);
            userIds[username] = user.UserId;
        }

        return userIds;
    }

    private static Dictionary<string, int> SeedCategories(ProductDb db, SeedData data)
    {
        var categoryIds = new Dictionary<string, int>();

        foreach (var name in data.Categories)
        {
            categoryIds[name] = db.InsertWithInt32Identity(new Category { Name = name });
        }

        return categoryIds;
    }

    private static Dictionary<string, Product> SeedProducts(
        ProductDb db,
        SeedData data,
        Dictionary<string, string> userIds,
        Dictionary<string, int> categoryIds,
        string imageDirectory)
    {
        var products = new Dictionary<string, Product>();
        var now = DateTime.UtcNow;

        foreach (var seedProduct in data.Products.OrderByDescending(p => p.DaysAgo))
        {
            var createdAt = now.AddDays(-seedProduct.DaysAgo).AddHours(-Random.Shared.Next(0, 12));

            var product = new Product
            {
                Title = seedProduct.Title,
                Description = seedProduct.Description,
                Price = seedProduct.Price,
                Stock = seedProduct.Stock,
                CategoryId = Lookup(categoryIds, seedProduct.Category, "category"),
                VendorId = Lookup(userIds, seedProduct.Vendor, "user"),
                Status = seedProduct.Status,
                IsActive = seedProduct.IsDeleted != true && (seedProduct.IsActive ?? true),
                IsDeleted = seedProduct.IsDeleted ?? false,
                CreatedAtUtc = createdAt,
                UpdatedAtUtc = createdAt
            };
            product.Id = db.InsertWithInt32Identity(product);

            for (var i = 0; i < seedProduct.Images.Count; i++)
            {
                var file = Path.Combine(imageDirectory, seedProduct.Images[i]);
                db.InsertWithInt32Identity(new ProductImage
                {
                    ProductId = product.Id,
                    IsPrimary = i == 0,
                    SortOrder = i,
                    Extension = Path.GetExtension(file),
                    Image = File.ReadAllBytes(file)
                });
            }

            products[product.Title] = product;
        }

        return products;
    }

    private static int SeedOrders(
        DataConnection db,
        SeedData data,
        Dictionary<string, string> userIds,
        Dictionary<string, Product> products)
    {
        var now = DateTime.UtcNow;
        var priorOrders = new Dictionary<(string Customer, string Vendor), int>();

        foreach (var seedOrder in data.Orders.OrderByDescending(o => o.DaysAgo))
        {
            var customerId = Lookup(userIds, seedOrder.Customer, "user");
            var orderId = db.InsertWithInt32Identity(new CustomerOrder
            {
                CustomerId = customerId,
                PurchasedAtUtc = now.AddDays(-seedOrder.DaysAgo).AddHours(-Random.Shared.Next(0, 12))
            });

            var items = seedOrder.Items.Select(item => (Product: Lookup(products, item.Product, "product"), item.Quantity)).ToList();
            var vendors = items.Select(i => i.Product.VendorId).Distinct().ToList();

            foreach (var (product, quantity) in items)
            {
                db.InsertWithInt32Identity(new OrderProduct
                {
                    OrderId = orderId,
                    ProductId = product.Id,
                    VendorId = product.VendorId,
                    Quantity = quantity,
                    UnitPriceAtPurchase = product.Price,
                    DiscountPercent = priorOrders.GetValueOrDefault((customerId, product.VendorId)) > 10 ? 20m : 0m
                });
            }

            foreach (var vendorId in vendors)
                priorOrders[(customerId, vendorId)] = priorOrders.GetValueOrDefault((customerId, vendorId)) + 1;
        }

        return data.Orders.Count;
    }

    private static T Lookup<T>(Dictionary<string, T> values, string key, string kind)
    {
        var normalized = kind == "user" ? key.Trim().ToLowerInvariant() : key;
        return values.TryGetValue(normalized, out var value)
            ? value
            : throw new InvalidOperationException($"seed.json refers to an unknown {kind}: '{key}'.");
    }

    private sealed record SeedData(
        string DefaultPassword,
        List<SeedUser> Users,
        List<string> Categories,
        List<SeedProduct> Products,
        List<SeedOrder> Orders);

    private sealed record SeedUser(string Username, string? Password, string? Role, bool? IsActive);

    private sealed record SeedProduct(
        string Title,
        string Description,
        decimal Price,
        int Stock,
        string Category,
        string Vendor,
        string Status,
        int DaysAgo,
        List<string> Images,
        bool? IsActive,
        bool? IsDeleted);

    private sealed record SeedOrder(string Customer, int DaysAgo, List<SeedOrderItem> Items);

    private sealed record SeedOrderItem(string Product, int Quantity);
}
