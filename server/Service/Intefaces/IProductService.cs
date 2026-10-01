using Service.Dtos;

namespace Service;

public interface IProductService
{
    public List<ProductResponseDTO> GetProducts();

    public ProductResponseDTO? GetProduct(int id);

    public List<ProductResponseDTO> SearchProducts(string search);

    public ProductResponseDTO CreateProduct(ProductRequestDTO dto);

    public ProductResponseDTO? UpdateProduct(int id, ProductRequestDTO dto);

    public bool DeleteProduct(int id);

    public List<ProductImageDTO> AddImages(int productId, List<ProductImageDataDTO> files);

    public ProductImageDataDTO? GetImageData(int imageId);

    public bool DeleteImage(int imageId);
}