namespace Service.Dtos;

public class OrderRequestDTO
{
    public string CustomerId { get; set; } = "";
    public List<OrderProductRequestDTO> Products { get; set; } = [];
}