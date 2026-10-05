using DefaultNamespace;
using Service.Exceptions;
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
    
    public List<OrderResponseDTO> GetCustomerOrders(string callerId, bool isAdmin)
    {
        var query = orderDb.CustomerOrders()
            .LoadWith(o => o.Products)
            .ThenLoad(op => op.Product)
            .AsQueryable();

        if (!isAdmin)
            query = query.Where(o => o.CustomerId == callerId);
        
        return query.ToList().Select(ToDto).ToList();
    }

    public OrderResponseDTO GetCustomerOrder(int orderId, string callerId, bool isAdmin)
    {
        var customerOrder = orderDb.CustomerOrders()
            .LoadWith(o => o.Products)
            .ThenLoad(op => op.Product)
            .FirstOrDefault(o => o.Id == orderId);
        
        if (customerOrder is null)
            throw new NotFoundException("Order with id = " + orderId + " was not found.");

        if (!isAdmin && customerOrder.CustomerId != callerId)
            throw new ForbiddenException("You do not have permission to view this order.");
        
        return ToDto(customerOrder);
    }

    public OrderResponseDTO CreateCustomerOrder(OrderRequestDTO dto, string customerId)
    {
        if (dto.Products is null || dto.Products.Count == 0)
            throw new BadRequestException("An order must contain at least one product.");
        
        var validatedItems = new List<(Product Product, int Quantity)>();

        foreach (var requestProduct in dto.Products)
        {
            var product = productDb.Products()
                .FirstOrDefault(p => p.Id == requestProduct.Productid);

            if (product is null)
                throw new NotFoundException("Product with id = " + requestProduct.Productid + " was not found.");

            if (requestProduct.Quantity <= 0)
                throw new BadRequestException("Quantity must be greater than zero for product with id= " + requestProduct.Productid);

            if (requestProduct.Quantity > product.Stock)
                throw new BadRequestException("Not enough stock for product with id = " + requestProduct.Productid);

            validatedItems.Add((product, requestProduct.Quantity));
        }

        var order = new CustomerOrder
        {
            CustomerId = customerId,
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

        var customerOrder = orderDb.CustomerOrders()
            .LoadWith(o => o.Products)
            .ThenLoad(op => op.Product)
            .FirstOrDefault(o => o.Id == order.Id);
        
        return ToDto(customerOrder!);
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