using Service;
using Service.Dtos;
using Service.Exceptions;

namespace Tests;

public class ProductServiceTests
{
    [Fact]
    public void UpdateProduct_EmptyTitle_ThrowsBadRequest()
    {
        // Arrange
        var service = new ProductService(null!, null!);

        var dto = new ProductRequestDTO
        {
            Title = "",
            Description = "Test product",
            Price = 100,
            Stock = 5,
            CategoryId = 1
        };

        // Act & Assert
        Assert.Throws<BadRequestException>(() =>
            service.UpdateProduct(1, dto, "user1", false));
    }

    [Fact]
    public void UpdateProduct_ZeroPrice_ThrowsBadRequest()
    {
        // Arrange
        var service = new ProductService(null!, null!);

        var dto = new ProductRequestDTO
        {
            Title = "Test product",
            Description = "Test description",
            Price = 0,
            Stock = 5,
            CategoryId = 1
        };

        // Act & Assert
        Assert.Throws<BadRequestException>(() =>
            service.UpdateProduct(1, dto, "user1", false));
    }

    [Fact]
    public void UpdateProduct_NegativeStock_ThrowsBadRequest()
    {
        // Arrange
        var service = new ProductService(null!, null!);

        var dto = new ProductRequestDTO
        {
            Title = "Test product",
            Description = "Test description",
            Price = 100,
            Stock = -1,
            CategoryId = 1
        };

        // Act & Assert
        Assert.Throws<BadRequestException>(() =>
            service.UpdateProduct(1, dto, "user1", false));
    }

    [Fact]
    public void UpdateStock_NegativeStock_ThrowsBadRequest()
    {
        // Arrange
        var service = new ProductService(null!, null!);

        // Act & Assert
        Assert.Throws<BadRequestException>(() =>
            service.UpdateStock(1, -1, "user1", false));
    }
}
