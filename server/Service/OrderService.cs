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
        
        return ToDtos(query.ToList());
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
                .FirstOrDefault(p => p.Id == requestProduct.Productid && p.Status == "Approved"  && p.IsActive);//vendor must still see their inactive listings

            if (product is null)
                throw new NotFoundException("Product with id = " + requestProduct.Productid + " was not found.");

            if (product.VendorId == customerId)
                throw new BadRequestException("You cannot order your own product (product id = " +
                                              requestProduct.Productid + ").");

            if (requestProduct.Quantity <= 0)
                throw new BadRequestException("Quantity must be greater than zero for product with id= " + requestProduct.Productid);

            if (requestProduct.Quantity > product.Stock)
                throw new BadRequestException("Not enough stock for product with id = " + requestProduct.Productid);

            validatedItems.Add((product, requestProduct.Quantity));
        }

        var discountPerVendor = GetDiscountPercentPerVendor(
            customerId, 
            validatedItems.Select(i => i.Product.VendorId));
        
        var order = new CustomerOrder
        {
            CustomerId = customerId,
            PurchasedAtUtc = DateTime.UtcNow
        };

        order.Id = orderDb.InsertWithInt32Identity(order);

        foreach (var (product, quantity) in validatedItems)
        {
            var discountPercent = discountPerVendor.GetValueOrDefault(product.VendorId, 0m);
            
            var orderProduct = new OrderProduct
            {
                OrderId = order.Id,
                ProductId = product.Id,
                VendorId = product.VendorId,
                Quantity = quantity,
                UnitPriceAtPurchase = product.Price,
                DiscountPercent = discountPercent
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

    private Dictionary<string, string> UsernamesFor(IEnumerable<string> userIds)
    {
        var ids = userIds.Distinct().ToList();
        return orderDb.GetTable<User>()
            .Where(u => ids.Contains(u.UserId))
            .ToDictionary(u => u.UserId, u => u.Username);
    }

    private List<OrderResponseDTO> ToDtos(List<CustomerOrder> orders)
    {
        var usernames = UsernamesFor(orders.SelectMany(o => o.Products.Select(op => op.VendorId).Append(o.CustomerId)));
        return orders.Select(o => ToDto(o, usernames)).ToList();
    }

    private OrderResponseDTO ToDto(CustomerOrder o) =>
        ToDto(o, UsernamesFor(o.Products.Select(op => op.VendorId).Append(o.CustomerId)));

    private static OrderResponseDTO ToDto(CustomerOrder o, IReadOnlyDictionary<string, string> usernames) => new()
    {
        Id = o.Id,
        CustomerId = o.CustomerId,
        CustomerUsername = usernames.GetValueOrDefault(o.CustomerId, ""),
        PurchasedAtUtc = o.PurchasedAtUtc,
        Products = o.Products
            .Select(op => new OrderProductResponseDTO
            {
                ProductId = op.ProductId,
                ProductTitle = op.Product.Title,
                Quantity = op.Quantity,
                VendorId = op.VendorId,
                VendorUsername = usernames.GetValueOrDefault(op.VendorId, ""),
                DiscountPercent = op.DiscountPercent
            })
            .ToList()
    };

    private Dictionary<string, int> CountPriorOrdersPerVendor(string customerId, IEnumerable<string> vendorIds)
    {
        var ids = vendorIds.Distinct().ToList();
        
        return (from o in orderDb.CustomerOrders()
                join op in orderDb.OrderProducts() on o.Id equals op.OrderId
                where o.CustomerId == customerId && ids.Contains(op.VendorId)
                select new { op.VendorId, op.OrderId })
            .Distinct()
            .ToList()
            .GroupBy(x => x.VendorId)
            .ToDictionary(g => g.Key, g => g.Count());
    }

    private Dictionary<string, decimal> GetDiscountPercentPerVendor(string customerId, IEnumerable<string> vendorIds)
    {
        var prior = CountPriorOrdersPerVendor(customerId, vendorIds);   // same query as before
        return prior.ToDictionary(
            kv => kv.Key,
            kv => kv.Value > 10 ? 20m : 0m);
    }
}