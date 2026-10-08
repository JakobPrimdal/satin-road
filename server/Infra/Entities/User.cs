using LinqToDB.Mapping;

namespace Infrastructure.Entities;

public class User
{
    [PrimaryKey] public string UserId { get; set; } = "";
    public string Username { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string Role { get; set; } = "User";
    public bool IsActive { get; set; } = true;
    
    public bool IsBlocked { get; set; } = false;   // blocked by an admin (IsActive false means seized by the FBI)
}

