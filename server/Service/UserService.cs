using DefaultNamespace;
using Infrastructure;
using Infrastructure.Entities;
using LinqToDB;
using Service.Dtos;
using Service.Exceptions;

namespace Service;

public class UserService(LoginDb loginDb, ProductDb productDb, OrderDb orderDb)
{
    public List<AdminUserDTO> GetUsers()
    {
        var users = loginDb.Users.ToList();

        var listings = productDb.Products()
            .Where(p => !p.IsDeleted)
            .GroupBy(p => p.VendorId)
            .Select(g => new { VendorId = g.Key, Count = g.Count() })
            .ToDictionary(x => x.VendorId, x => x.Count);

        var orders = orderDb.CustomerOrders()
            .GroupBy(o => o.CustomerId)
            .Select(g => new { CustomerId = g.Key, Count = g.Count() })
            .ToDictionary(x => x.CustomerId, x => x.Count);

        return users
            .OrderBy(u => u.Username)
            .Select(u => new AdminUserDTO
            {
                UserId = u.UserId,
                Username = u.Username,
                Role = u.Role,
                IsBlocked = u.IsBlocked,
                IsSeized = !u.IsActive,
                ListingCount = listings.GetValueOrDefault(u.UserId, 0),
                OrderCount = orders.GetValueOrDefault(u.UserId, 0)
            })
            .ToList();
    }

    public AdminUserDTO SetUserBlocked(string userId, bool blocked, string callerId)
    {
        var user = loginDb.Users.FirstOrDefault(u => u.UserId == userId)
                   ?? throw new NotFoundException("User with id = " + userId + " was not found.");

        if (user.UserId == callerId)
            throw new BadRequestException("You can't block yourself.");
        if (user.Role == Roles.Admin)
            throw new BadRequestException("Admins can't be blocked.");
        if (!user.IsActive)
            throw new BadRequestException("This user has been seized by the FBI and can't be changed.");

        loginDb.Users
            .Where(u => u.UserId == userId)
            .Set(u => u.IsBlocked, blocked)
            .Update();

        return GetUsers().First(u => u.UserId == userId);
    }
}