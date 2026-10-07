using Facet;
using Infrastructure;
using Infrastructure.Entities;

namespace Service;

// Response DTO
[Facet(typeof(User), exclude: [nameof(User.PasswordHash)])]
public partial class UserDto;

// Request DTO git
public record RegisterRequestDto(string Username, string Password);

//Request DTO
public record LoginRequestDto(string Username, string Password);

// Response DTO: the token plus who logged in
public record LoginResponseDto(string Token, UserDto User);
