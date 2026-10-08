namespace Service.Dtos;

public class ProductResponseDTO
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public decimal Price { get; set; }
    public string Description { get; set; } = "";
    public int Stock { get; set; }
    public int CategoryId { get; set; }
    public string VendorId { get; set; } = "";
    public string VendorUsername { get; set; } = "";
    public string Status { get; set; } = "";
    public bool IsActive { get; set; }
     
    public DateTime? RestoredByAdminAtUtc { get; set; }
    
    public string? AdminNotice { get; set; }
    
    public bool VendorSeized { get; set; }
    public List<ProductImageDTO> Images { get; set; }
}