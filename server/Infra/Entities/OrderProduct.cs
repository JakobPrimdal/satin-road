using LinqToDB.Mapping;

namespace Infrastructure.Entities;

public class OrderProduct
{
    [PrimaryKey] [Identity] public int Id { get; set; }
    [Column] [NotNull] public int OrderId { get; set; }
    [Column] [NotNull] public int ProductId { get; set; }
    [Column] [NotNull] public string VendorId { get; set; }
    [Column] [NotNull] public int Quantity { get; set; }
    [Column] [NotNull] public decimal UnitPriceAtPurchase { get; set; }
    [Column] [NotNull] public decimal DiscountPercent { get; set; }
    
    [Association(ThisKey = nameof(ProductId), OtherKey = nameof(Product.Id))]
    public Product? Product { get; set; }
}