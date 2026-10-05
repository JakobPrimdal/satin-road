using System.Security.Cryptography;
using System.Text;
using Konscious.Security.Cryptography;

namespace Service;

public class PasswordHasher : IPasswordHasher
{
    public string HashPassword(string password, string salt)
    {
        using var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password));
        argon2.Salt = Convert.FromBase64String(salt);
        argon2.MemorySize = 64 * 1024;  
        argon2.Iterations = 3;
        argon2.DegreeOfParallelism = 4;

        string hash = Convert.ToBase64String(argon2.GetBytes(32));
        return $"{hash}.{salt}";  
    }
    
    public string HashAndSaltPassword(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);   
        return HashPassword(password, Convert.ToBase64String(salt));
    }
    
    public bool VerifyHashedPassword(string password, string hashedPassword)
    {
        var parts = hashedPassword.Split('.');
        if (parts.Length != 2) return false;  

        var computed = HashPassword(password, parts[1]);

        return CryptographicOperations.FixedTimeEquals(  
        Encoding.UTF8.GetBytes(computed),
        Encoding.UTF8.GetBytes(hashedPassword));
    }
}
