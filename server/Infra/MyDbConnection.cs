using LinqToDB;
using LinqToDB.Data;

namespace Infrastructure;

public class MyDbConnection (DataOptions<MyDbConnection> options)
    : DataConnection(options.Options)
{
    public ITable<User> Users => this.GetTable<User>();
    
}