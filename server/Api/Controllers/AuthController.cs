using Microsoft.AspNetCore.Mvc;
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
}