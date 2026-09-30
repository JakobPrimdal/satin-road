using Service.Dtos;

namespace Service;

public interface IProductService
{
    public List<ProductResponseDTO> GetProducts();

    public ProductResponseDTO? GetProduct(int id);

    public ProductResponseDTO CreateProduct(ProductRequestDTO dto);

    public ProductResponseDTO? UpdateProduct(int id, ProductRequestDTO dto);

    public bool DeleteProduct(int id);
}