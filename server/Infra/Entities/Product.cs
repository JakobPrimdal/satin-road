using System.Linq.Expressions;
using LinqToDB;
using LinqToDB.Mapping;

namespace Infrastructure.Entities;

[Table("Product")]
public class Product
{
    [PrimaryKey] [Identity] public int Id { get; set; }
    [Column] [NotNull] public string Title { get; set; } = "";
    [Column] [NotNull] public string Description { get; set; } = "";
    [Column] [NotNull] public decimal Price { get; set; }
    [Column] [NotNull] public int Stock { get; set; }
    [Column] [NotNull] public DateTime CreatedAtUtc { get; set; }
    [Column] [NotNull] public DateTime UpdatedAtUtc { get; set; }
    [Column] [NotNull] public int CategoryId { get; set; }
    [Column] [NotNull] public string VendorId { get; set; }
    [Column] [NotNull] public string Status { get; set; }

    [Association(ThisKey = nameof(Id), OtherKey = nameof(ProductImage.ProductId))]
    public IEnumerable<ProductImage> Images { get; set; } = [];
}