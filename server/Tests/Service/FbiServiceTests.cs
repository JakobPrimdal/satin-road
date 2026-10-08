using Xunit;
using Service;

namespace Tests;

public class FbiServiceTests
{
    // A pretend random number provider
    private class FixedRandom : IRandomProvider
    {
        private readonly double numberToReturn;

        public FixedRandom(double numberToReturn)
        {
            this.numberToReturn = numberToReturn;
        }

        public double NextDouble()
        {
            return numberToReturn;
        }
    }

    [Fact]
    public void No_raid_above_the_chance()
    {
        // Arrange
        var fakeRandom = new FixedRandom(0.5);
        var settings = new FbiSettings(0.01);
        var fbi = new FbiService(null!, null!, fakeRandom, settings);

        // Act
        bool result = fbi.ShouldRaid();

        // Assert
        Assert.False(result);
    }

    [Theory]

    [InlineData(0.0,     true)]   
    [InlineData(0.005,   true)]    
    [InlineData(0.0099,  true)]    
    [InlineData(0.01,    false)]   
    [InlineData(0.02,    false)]   
    [InlineData(0.5,     false)]   
    [InlineData(0.99,    false)]   
    public void Chance_for_raid(double chance, bool expected)
    {
        // Arrange
        var fakeRandom = new FixedRandom(chance);
        var settings = new FbiSettings(0.01);  
        var fbi = new FbiService(null!, null!, fakeRandom, settings);

        // Act
        bool actual = fbi.ShouldRaid();

        // Assert
        Assert.Equal(expected, actual);
    }

}