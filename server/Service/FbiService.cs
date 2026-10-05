using System.ComponentModel.DataAnnotations;
using Infrastructure;
using LinqToDB;
using LinqToDB.Async;

namespace Service;

public record FbiSettings(double RaidChance);

public class FbiService(MyDbConnection db, IRandomProvider random, FbiSettings settings)
{
    
    public async Task<bool> RollForRaid(string vendorId)
    {
        
        if (random.NextDouble() >= settings.RaidChance)
            return false;   

        await RaidVendor(vendorId);
        return true;
    }
    
    public async Task RaidVendor(string vendorId)
    {
        var vendor = await db.Users.FirstOrDefaultAsync(u => u.UserId == vendorId)
                     ?? throw new KeyNotFoundException("Vendor not found");

        if (vendor.Role == Roles.Admin)
            throw new ValidationException("The FBI can't raid an admin");

        if (!vendor.IsActive)
            return;   // already seized, nothing to do

        
        await db.Users
            .Where(u => u.UserId == vendorId)
            .Set(u => u.IsActive, false)
            .UpdateAsync();

        // TODO sfter product is there
    }
}