using System.ComponentModel.DataAnnotations;
using Infrastructure;
using LinqToDB;
using LinqToDB.Async;

namespace Service;

public class AuthService (MyDbConnection db)   
{
    public async Task<UserDto> Register(RegisterRequestDto dto)
    {
        var username = (dto.Username ?? "").Trim().ToLowerInvariant();
        var password = dto.Password ?? "";

        // validate
        if (username.Length < 3)
            throw new ValidationException("Username must be at least 3 characters");
        if (username.Length > 30)
            throw new ValidationException("Username can be at most 30 characters");
        if (password.Length < 1)
            throw new ValidationException("Password must be at least 1 characters");
        
        if (await db.Users.AnyAsync(u => u.Username == username))
            throw new ValidationException("Username is already taken");

        //  Build the entity
        var user = new User
        {
            UserId = Guid.NewGuid().ToString(),             
            Username = username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = "User",
            IsActive = true
        };

        // save
        await db.InsertAsync(user);
        
        return new UserDto(user);
    }
}
