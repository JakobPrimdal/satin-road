using Service.Dtos;

namespace Service;

public interface IProductService
{
    public List<ProductResponseDTO> GetProducts();

    public ProductResponseDTO GetProduct(int id);

    public List<ProductResponseDTO> SearchProducts(string search);

    public ProductResponseDTO CreateProduct(ProductRequestDTO dto, string vendorId);

    public ProductResponseDTO UpdateProduct(int id, ProductRequestDTO dto, string callerId, bool isAdmin);

    public void DeleteProduct(int id, string callerId, bool isAdmin);

    public List<ProductImageDTO> AddImages(int productId, List<ProductImageDataDTO> files, string callerId, bool isAdmin);

    public ProductImageDataDTO GetImageData(int imageId);

    public void DeleteImage(int imageId, string callerId, bool isAdmin);
}