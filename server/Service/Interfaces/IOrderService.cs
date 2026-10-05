using Infrastructure.Entities;
using Service.Dtos;

namespace Service;

public interface IOrderService
{
    public List<OrderResponseDTO> GetCustomerOrders(string callerId, bool isAdmin);

    public OrderResponseDTO GetCustomerOrder(int orderId, string callerId, bool isAdmin);

    public OrderResponseDTO CreateCustomerOrder(OrderRequestDTO dto, string customerId);
}