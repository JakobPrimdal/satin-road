using Microsoft.AspNetCore.Mvc;
using Service;

namespace Api.Controllers;

public class AuthController(AuthService authService) : ControllerBase
{
    [HttpPost(nameof(Register))]
    public async Task<UserDto> Register([FromBody] RegisterRequestDto dto)
        => await authService.Register(dto);
}