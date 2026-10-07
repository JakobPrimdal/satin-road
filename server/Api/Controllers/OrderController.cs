using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Service;
using Service.Dtos;

namespace Api.Controllers;

[ApiController]
[Authorize]
public class OrderController(OrderService service) : ControllerBase
{
    [HttpGet(nameof(GetOrders))]
    public List<OrderResponseDTO> GetOrders()
    {
        return service.GetCustomerOrders(User.GetUserId(), User.IsAdmin());
    }

    [HttpGet(nameof(GetOrder))]
    public ActionResult<OrderResponseDTO> GetOrder(int orderId)
    {
        return service.GetCustomerOrder(orderId, User.GetUserId(), User.IsAdmin());
    }

    [HttpPost(nameof(PlaceOrder))]
    public OrderResponseDTO PlaceOrder(OrderRequestDTO dto)
    {
        return service.CreateCustomerOrder(dto, User.GetUserId());
    }
}