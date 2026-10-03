using System.Security.Claims;
using Infrastructure.Entities;
using Microsoft.IdentityModel.JsonWebTokens;

namespace Api;

public static class ClaimsPrincipalExtensions
{
    public static string GetUserId(this ClaimsPrincipal user) =>
        user.FindFirstValue(JwtRegisteredClaimNames.Sub)!;

    public static bool IsAdmin(this ClaimsPrincipal user) =>
        user.IsInRole(Roles.Admin);
}