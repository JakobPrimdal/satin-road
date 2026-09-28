using System.Linq.Expressions;
using LinqToDB;
using LinqToDB.Mapping;

namespace Infrastructure.Entities;

[Table("ProductImage")]
public class ProductImage
{
    [PrimaryKey] [Identity] public int Id { get; set; }
    [Column] [NotNull] public int ProductId { get; set; }
    [Column] [NotNull] public bool IsPrimary { get; set; }
    [Column] [NotNull] public int SortOrder { get; set; }
    [Column] [NotNull] public string Extension { get; set; } = "";
    [Column] [NotNull] public byte[] Image { get; set; } = [];
}