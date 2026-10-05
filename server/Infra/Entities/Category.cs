using LinqToDB.Mapping;

namespace Infrastructure.Entities;

[Table("Category")]
public class Category
{
    [PrimaryKey] [Identity] public int Id { get; set; }
    [Column] [NotNull] public string Name { get; set; }
}