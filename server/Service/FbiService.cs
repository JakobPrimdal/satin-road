using System.ComponentModel.DataAnnotations;
using Infrastructure;
using Infrastructure.Entities;
using LinqToDB;
using LinqToDB.Async;
using Service.Exceptions;

namespace Service;

public record FbiSettings(double RaidChance);

public class FbiService(LoginDb loginDb, ProductDb productDb, IRandomProvider random, FbiSettings settings)
{
    // True with a chance of RaidChance (0.01 = 1%)
    public bool ShouldRaid() => random.NextDouble() < settings.RaidChance;

    // Called once per vendor for every order. Returns true if the vendor got seized now.
    public bool RollForRaid(string vendorId)
    {
        if (!ShouldRaid())
            return false;

        var vendor = loginDb.Users.FirstOrDefault(u => u.UserId == vendorId);
        if (vendor is null || vendor.Role == Roles.Admin || !vendor.IsActive)
            return false; // never raid admins, and don't raid twice

        Seize(vendorId);
        return true;
    }

    // Manual raid by an admin (testing )
    public void RaidVendor(string vendorId)
    {
        var vendor = loginDb.Users.FirstOrDefault(u => u.UserId == vendorId)
                     ?? throw new NotFoundException("Vendor with id = " + vendorId + " was not found.");

        if (vendor.Role == Roles.Admin)
            throw new BadRequestException("The FBI can't raid an admin.");

        if (!vendor.IsActive)
            throw new BadRequestException("This vendor has already been seized.");

        Seize(vendorId);
    }

    public bool IsSeized(string userId) =>
        loginDb.Users.Any(u => u.UserId == userId && !u.IsActive);

    // Account can't log in anymore, and all products go off the market
    private void Seize(string vendorId)
    {
        loginDb.Users
            .Where(u => u.UserId == vendorId)
            .Set(u => u.IsActive, false)
            .Update();

        productDb.Products()
            .Where(p => p.VendorId == vendorId)
            .Set(p => p.IsActive, false)
            .Set(p => p.UpdatedAtUtc, DateTime.UtcNow)
            .Update();
    }
}