using Infrastructure.Entities;
using LinqToDB;
using LinqToDB.Data;

namespace DefaultNamespace;

public class OrderDb(DataOptions<OrderDb> dataOptions) : DataConnection(dataOptions.Options)
{
    public ITable<CustomerOrder> CustomerOrders()
    {
        return this.GetTable<CustomerOrder>();
    }

    public ITable<OrderProduct> OrderProducts()
    {
        return this.GetTable<OrderProduct>();
    }
}