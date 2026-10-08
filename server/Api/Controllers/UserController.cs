using Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Service;
using Service.Dtos;

namespace Api.Controllers;

[ApiController]
[Authorize(Roles = Roles.Admin)]
public class UserController(UserService service) : ControllerBase
{
    [HttpGet(nameof(GetUsers))]
    public List<AdminUserDTO> GetUsers()
    {
        return service.GetUsers();
    }

    [HttpPut(nameof(SetUserBlocked))]
    public AdminUserDTO SetUserBlocked(string userId, bool blocked)
    {
        return service.SetUserBlocked(userId, blocked, User.GetUserId());
    }
}