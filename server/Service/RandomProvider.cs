namespace Service;

//  interface for randomness for  tests
public interface IRandomProvider
{
    double NextDouble();  
}

public class RandomProvider : IRandomProvider
{
    public double NextDouble() => Random.Shared.NextDouble();
}