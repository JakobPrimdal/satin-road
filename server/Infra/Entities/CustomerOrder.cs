using LinqToDB.Mapping;

namespace Infrastructure.Entities;

public class CustomerOrder
{
    [PrimaryKey] [Identity] public int Id { get; set; }
    [Column] [NotNull] public int CustomerId { get; set; }
    [Column] [NotNull] public DateTime PurchasedAtUtc { get; set; }

    [Association(ThisKey = nameof(Id), OtherKey = nameof(OrderProduct.OrderId))]
    public IEnumerable<OrderProduct> Products { get; set; } = [];
}