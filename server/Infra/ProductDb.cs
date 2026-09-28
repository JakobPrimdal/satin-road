using Infrastructure.Entities;
using Infrastructure.Interfaces;
using LinqToDB;
using LinqToDB.Data;

namespace Infrastructure;

public class ProductDb(DataOptions<ProductDb> dataOptions) : DataConnection(dataOptions.Options), IProductDb
{
    public ITable<Product> Products()
    {
        return this.GetTable<Product>();
    }
    
    public ITable<ProductImage> ProductImages()
    {
        return this.GetTable<ProductImage>();
    }
}