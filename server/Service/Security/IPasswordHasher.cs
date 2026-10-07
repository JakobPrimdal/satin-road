namespace Service;


    public interface IPasswordHasher
    {
        string HashPassword(string password, string salt);
        string HashAndSaltPassword(string password);
        bool VerifyHashedPassword(string password, string hashedPassword);
    }

