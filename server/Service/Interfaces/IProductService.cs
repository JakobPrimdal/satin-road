using Service.Dtos;

namespace Service;

public interface IProductService
{
    public List<ProductResponseDTO> GetProducts(string callerId);

    public List<ProductResponseDTO> GetMyProducts(string callerId);

    public List<ProductResponseDTO> GetPendingProducts();

    public ProductResponseDTO GetProduct(int id, string callerId, bool isAdmin);

    public List<ProductResponseDTO> SearchProducts(string search, string callerId);

    public ProductResponseDTO CreateProduct(ProductRequestDTO dto, string vendorId, bool isAdmin);

    public ProductResponseDTO UpdateProduct(int id, ProductRequestDTO dto, string callerId, bool isAdmin);

    public ProductResponseDTO SetProductApproval(int productId, string status);

    public void DeleteProduct(int id, string callerId, bool isAdmin);

    public List<ProductImageDTO> AddImages(int productId, List<ProductImageDataDTO> files, string callerId, bool isAdmin);

    public ProductImageDataDTO GetImageData(int imageId, string callerId, bool isAdmin);

    public void DeleteImage(int imageId, string callerId, bool isAdmin);
}