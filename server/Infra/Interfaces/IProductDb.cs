using Infrastructure.Entities;
using LinqToDB;

namespace Infrastructure.Interfaces;

public interface IProductDb
{
    public ITable<Product> Products();
    
}