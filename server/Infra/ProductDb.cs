using Infrastructure.Entities;
using LinqToDB;
using LinqToDB.Data;

namespace Infrastructure;

public class ProductDb(DataOptions<ProductDb> dataOptions) : DataConnection(dataOptions.Options)
{
    public ITable<Product> Products()
    {
        return this.GetTable<Product>();
    }
    
    public ITable<ProductImage> ProductImages()
    {
        return this.GetTable<ProductImage>();
    }

    public ITable<Category> Categories()
    {
        return this.GetTable<Category>();
    }
  
}