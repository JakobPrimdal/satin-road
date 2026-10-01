namespace Service.Dtos;

public class OrderRequestDTO
{
    public int CustomerId { get; set; }
    public List<OrderProductRequestDTO> Products { get; set; } = [];
}