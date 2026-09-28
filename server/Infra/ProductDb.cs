using LinqToDB;
using LinqToDB.Data;

namespace Infrastructure;

public class ProductDb(DataOptions<ProductDb> dataOptions) : DataConnection(dataOptions.Options)
{
    public ITable<Product> Products()
    {
        return this.GetTable<Product>();
    }
    
    
}