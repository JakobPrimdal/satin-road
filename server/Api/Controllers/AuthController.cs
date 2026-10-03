using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.JsonWebTokens;
using Service;

namespace Api.Controllers;

public class AuthController(AuthService authService) : ControllerBase
{
    [HttpPost(nameof(Register))]
    public async Task<UserDto> Register([FromBody] RegisterRequestDto dto)
        => await authService.Register(dto);
    
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [HttpPost(nameof(Login))]
    public async Task<LoginResponseDto> Login([FromBody] LoginRequestDto dto)
        => await authService.Login(dto);
    [Authorize]  //means only with a valid token
    [HttpGet(nameof(GetMe))]
    public async Task<UserDto> GetMe()
    {
        var userId = HttpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub)!;
        return await authService.GetUser(userId);
    }
    
    [Authorize(Roles = Roles.Admin)]
    [HttpGet(nameof(AdminCheck))]
    public string AdminCheck() => "You are an admin";
}