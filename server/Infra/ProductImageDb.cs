using Infrastructure.Entities;
using LinqToDB;
using LinqToDB.Data;

namespace Infrastructure;

public class ProductImageDb(DataOptions<ProductImageDb> dataOptions): DataConnection(dataOptions.Options)
{
    public ITable<ProductImage> ProductImages()
    {
        return this.GetTable<ProductImage>();
    }
}