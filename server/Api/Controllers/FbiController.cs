using Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Service;

namespace Api.Controllers;

[ApiController]
[Authorize(Roles = Roles.Admin)]
public class FbiController(FbiService fbi) : ControllerBase
{
    [HttpPost(nameof(RaidVendor))]
    public IActionResult RaidVendor(string vendorId)
    {
        fbi.RaidVendor(vendorId);
        return NoContent();
    }
}