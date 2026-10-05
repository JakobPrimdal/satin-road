using System.ComponentModel.DataAnnotations;
using Infrastructure;
using Infrastructure.Entities;
using LinqToDB;
using LinqToDB.Async;
using Service.Exceptions;

namespace Service;

public class AuthService (LoginDb db,TokenService tokenService)   
{
    public async Task<UserDto> Register(RegisterRequestDto dto)
    {
        var username = (dto.Username ?? "").Trim().ToLowerInvariant();
        var password = dto.Password ?? "";

        // validate
        if (username.Length < 3)
            throw new BadRequestException("Username must be at least 3 characters");
        if (username.Length > 30)
            throw new BadRequestException("Username can be at most 30 characters");
        if (password.Length < 1)
            throw new BadRequestException("Password must be at least 1 characters");
        
        if (await db.Users.AnyAsync(u => u.Username == username))
            throw new BadRequestException("Username is already taken");

        //  Build the entity
        var user = new User
        {
            UserId = Guid.NewGuid().ToString(),             
            Username = username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = Roles.User,
            IsActive = true
        };

        // save
        await db.InsertAsync(user);
        
        return new UserDto(user);
    }
    public async Task<LoginResponseDto> Login(LoginRequestDto dto)
    {
        var username = (dto.Username ?? "").Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);

        
        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password ?? "", user.PasswordHash))
            throw new UnauthorizedException("Invalid username or password");

        // When FBI blocks
        if (!user.IsActive)
            throw new UnauthorizedException("This account has been seized by the FBI");

        return new LoginResponseDto(tokenService.CreateToken(user), new UserDto(user));
    }
    public async Task<UserDto> GetUser(string userId)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.UserId == userId)
                   ?? throw new NotFoundException("User not found");
        return new UserDto(user);
    }
    
    public async Task SeedAdmin(string username, string password)
    {
        // Only create one if no admin exists yet
        if (await db.Users.AnyAsync(u => u.Role == Roles.Admin)) return;

        await db.InsertAsync(new User
        {
            UserId = Guid.NewGuid().ToString(),
            Username = username.Trim().ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = Roles.Admin,
            IsActive = true
        });
    }
}
