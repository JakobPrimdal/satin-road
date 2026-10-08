using Service;

namespace Tests;

public class PasswordHasherTests
{
    private readonly PasswordHasher hasher = new();

    [Fact]
    public void Password_Correct()
    {
        // Arrange
        var stored = hasher.HashAndSaltPassword("secret123");

        // Act
        var result = hasher.VerifyHashedPassword("secret123", stored);

        // Assert
        Assert.True(result);
    }

    [Fact]

    public void Password_Wrong()
    {
        var stored = hasher.HashAndSaltPassword("secret123");
        
        var result = hasher.VerifyHashedPassword("secret", stored);
        
        Assert.False(result);
    }

    [Fact]
    
    public void SamePaswords_Different_afterHasing_()
    {
        var first_password = hasher.HashAndSaltPassword("secret123");
        var second_password = hasher.HashAndSaltPassword("secret123");
        Assert.NotEqual(first_password, second_password);
    }
}