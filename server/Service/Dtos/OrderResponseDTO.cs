namespace Service.Dtos;

public class OrderResponseDTO
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public DateTime PurchasedAtUtc { get; set; }
    public List<OrderProductResponseDTO> Products { get; set; } = [];
}