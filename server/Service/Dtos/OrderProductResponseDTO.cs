namespace Service.Dtos;

public class OrderProductResponseDTO
{
    public int ProductId { get; set; }
    public string ProductTitle { get; set; }
    public int Quantity { get; set; }
    public string VendorId { get; set; } = "";
    public decimal DiscountPercent { get; set; }
}