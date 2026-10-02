using Microsoft.AspNetCore.Mvc;
using Service;
using Service.Dtos;

namespace Api.Controllers;

[ApiController]
public class OrderController(OrderService service) : ControllerBase
{
    [HttpGet(nameof(GetOrders))]
    public List<OrderResponseDTO> GetOrders()
    {
        return service.GetCustomerOrders();
    }

    [HttpGet(nameof(GetOrder))]
    public ActionResult<OrderResponseDTO> GetOrder(int orderId)
    {
        return service.GetCustomerOrder(orderId);
    }

    [HttpPost(nameof(PlaceOrder))]
    public OrderResponseDTO PlaceOrder(OrderRequestDTO dto)
    {
        return service.CreateCustomerOrder(dto);
    }
}