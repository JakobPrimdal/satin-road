namespace Service.Dtos;

// What the admin sees per user on the Users page
public class AdminUserDTO
{
    public string UserId { get; set; } = "";
    public string Username { get; set; } = "";
    public string Role { get; set; } = "";
    public bool IsBlocked { get; set; }
    public bool IsSeized { get; set; }
    public int ListingCount { get; set; }
    public int OrderCount { get; set; }
}