using LinqToDB;
using LinqToDB.Data;

namespace Infrastructure;

public class MyDataBaseConnection (DataOptions<MyDataBaseConnection> options)
    : DataConnection(options.Options)
{
    public ITable<User> Users => this.GetTable<User>();
    
}