using DefaultNamespace;
using Infrastructure;
using Infrastructure.Entities;
using LinqToDB;
using Service.Dtos;

namespace Service;

public class OrderService : IOrderService
{
    private readonly OrderDb orderDb;
    private readonly ProductDb productDb;

    public OrderService(OrderDb orderDb, ProductDb productDb)
    {
        this.orderDb = orderDb;
        this.productDb = productDb;
    }
    
    public List<OrderResponseDTO> GetCustomerOrders()
    {
        var orders = orderDb.CustomerOrders().ToList();
        
        return orders.Select(ToDto).ToList();
    }

    public OrderResponseDTO? GetCustomerOrder(int orderId)
    {
        var customerOrder = orderDb.CustomerOrders()
            .LoadWith(o => o.Products)
            .ThenLoad(op => op.Product)
            .FirstOrDefault(o => o.Id == orderId);

        return customerOrder is null ? null : ToDto(customerOrder);
    }

    public OrderResponseDTO CreateCustomerOrder(OrderRequestDTO dto)
    {
        var validatedItems = new List<(Product Product, int Quantity)>();

        foreach (var requestProduct in dto.Products)
        {
            var product = productDb.Products()
                .FirstOrDefault(p => p.Id == requestProduct.Productid);

            if (product is null)
                throw new ArgumentException("Product with id: " + requestProduct.Productid + " was not found.");

            if (requestProduct.Quantity <= 0)
                throw new ArgumentException("Quantity must be greater than zero for product with id: " + requestProduct.Productid);

            if (requestProduct.Quantity > product.Stock)
                throw new ArgumentException("Not enough stock for product with id: " + requestProduct.Productid);

            validatedItems.Add((product, requestProduct.Quantity));
        }

        var order = new CustomerOrder
        {
            CustomerId = dto.CustomerId,
            PurchasedAtUtc = DateTime.UtcNow
        };

        order.Id = orderDb.InsertWithInt32Identity(order);

        foreach (var (product, quantity) in validatedItems)
        {
            var orderProduct = new OrderProduct
            {
                OrderId = order.Id,
                ProductId = product.Id,
                VendorId = product.VendorId,
                Quantity = quantity,
                UnitPriceAtPurchase = product.Price
            };

            orderDb.InsertWithInt32Identity(orderProduct);

            product.Stock -= quantity;
            product.UpdatedAtUtc = DateTime.UtcNow;
            productDb.Update(product);
        }

        return GetCustomerOrder(order.Id)!;
    }

    private static OrderResponseDTO ToDto(CustomerOrder o) => new()
    {
        Id = o.Id,
        CustomerId = o.CustomerId,
        PurchasedAtUtc = o.PurchasedAtUtc,
        Products = o.Products
            .Select(op => new OrderProductResponseDTO
            {
                ProductId = op.ProductId,
                ProductTitle = op.Product.Title,
                Quantity = op.Quantity,
                VendorId = op.VendorId
            })
            .ToList()
    };
}