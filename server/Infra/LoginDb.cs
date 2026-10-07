using Infrastructure.Entities;
using LinqToDB;
using LinqToDB.Data;


namespace Infrastructure;

public class LoginDb (DataOptions<LoginDb> options)
    : DataConnection(options.Options)
{
    public ITable<User> Users => this.GetTable<User>();
    
}