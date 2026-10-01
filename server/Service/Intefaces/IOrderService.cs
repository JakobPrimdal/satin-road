using Infrastructure.Entities;
using Service.Dtos;

namespace Service;

public interface IOrderService
{
    public List<OrderResponseDTO> GetCustomerOrders();

    public OrderResponseDTO? GetCustomerOrder(int orderId);

    public OrderResponseDTO CreateCustomerOrder(OrderRequestDTO dto);
}