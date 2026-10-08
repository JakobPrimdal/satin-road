using Infrastructure;
using Infrastructure.Entities;
using LinqToDB;
using Service.Dtos;
using Service.Exceptions;

namespace Service;

public class ProductService: IProductService
{
    private readonly ProductDb db;
    private readonly LoginDb loginDb;

    public ProductService(ProductDb db, LoginDb loginDb)
    {
        this.db = db;
        this.loginDb = loginDb;
    }
    
    public List<ProductResponseDTO> GetProducts(string callerId)
    {
        var blocked = BlockedVendorIds();
        return ToDtos(db.Products()
            .LoadWith(p => p.Images)
            .Where(p => p.Status == ProductStatus.Approved && p.IsActive && !blocked.Contains(p.VendorId))
            .ToList());
    }

    public List<ProductResponseDTO> GetMyProducts(string callerId)
    {
        return ToDtos(db.Products()
            .LoadWith(p => p.Images)
            .Where(p => p.VendorId == callerId && !p.IsDeleted)
            .ToList());
    }
    public List<ProductResponseDTO> GetAllProducts()
    {
        return ToDtos(db.Products()
            .LoadWith(p => p.Images)
            .ToList());
    }

    public List<ProductResponseDTO> GetPendingProducts()
    {
        return ToDtos(db.Products()
            .LoadWith(p => p.Images)
            .Where(p => p.Status == ProductStatus.Pending && p.IsActive)
            .ToList());
    }

    public ProductResponseDTO GetProduct(int id, string callerId, bool isAdmin)
    {
        Product? product = db.Products()
            .LoadWith(p => p.Images)
            .FirstOrDefault(p => p.Id == id);

        if (product is null)
            throw new NotFoundException("Product with id = " + id + " was not found.");

        if (!isAdmin && product.VendorId != callerId)
            throw new ForbiddenException("You do not have permission to modify this product.");

        return ToDto(product);
    }

    public List<ProductResponseDTO> SearchProducts(string search, string callerId)
    {
        if (string.IsNullOrWhiteSpace(search))
            return GetProducts(callerId);
        var blocked = BlockedVendorIds();
        List<Product> matches = db.Products()
            .LoadWith(p => p.Images)
            .Where(p => p.Status == ProductStatus.Approved && p.IsActive && !blocked.Contains(p.VendorId)
                        && (p.Title.Contains(search) || p.Description.Contains(search)))
            .ToList();

        return ToDtos(matches);
    }

    public ProductResponseDTO CreateProduct(ProductRequestDTO dto, string vendorId, bool isAdmin)
    {
        EnsureCategoryExists(dto.CategoryId);
        IsProductValid(dto);
        
        Product product = new Product()
        {
            Title = dto.Title.Trim(),
            Description = (dto.Description ?? "").Trim(),
            Price = dto.Price,
            Stock = dto.Stock,
            CategoryId = dto.CategoryId,
            VendorId = vendorId,
            Status = isAdmin ? ProductStatus.Approved : ProductStatus.Pending,
            IsActive = true,  
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        product.Id = db.InsertWithInt32Identity(product);

        return ToDto(product);
    }
    
    // Seized accounts can't change anything, even with an old login token.
    // Also catches a token for a user that no longer exists 
    private void EnsureNotSeized(string userId)
    {
        var user = loginDb.Users.FirstOrDefault(u => u.UserId == userId)
                   ?? throw new UnauthorizedException("Your session is no longer valid. Please log in again.");
        if (!user.IsActive)
            throw new ForbiddenException("This account has been seized by the FBI.");
    }

    public ProductResponseDTO UpdateProduct(int id, ProductRequestDTO dto, string callerId, bool isAdmin)
    {
        IsProductValid(dto);
        Product? product = db.Products().FirstOrDefault(p => p.Id == id);
        if (product is null)
            throw new NotFoundException("Product with id = " + id + " was not found.");

        if (!isAdmin && product.VendorId != callerId)
            throw new ForbiddenException("You do not have permission to modify this product.");
        
        EnsureCategoryExists(dto.CategoryId);

        product.Title = dto.Title.Trim();
        product.Description =(dto.Description ?? "").Trim();
        product.Price = dto.Price;
        product.Stock = dto.Stock;
        product.CategoryId = dto.CategoryId;
        product.UpdatedAtUtc = DateTime.UtcNow;

        if (!isAdmin)
            product.Status = ProductStatus.Pending;

        db.Update(product);

        return GetProduct(id, callerId, isAdmin);
    }

    public ProductResponseDTO SetProductApproval(int productId, string status)
    {
        if (!db.Products().Any(p => p.Id == productId))
            throw new NotFoundException("Product with id = " + productId + " was not found.");
        
        // Updates only the status column, so UpdatedAtUtc is not touched
        db.Products()
            .Where(p => p.Id == productId)
            .Set(p => p.Status, status)
            .Update();

        return ToDto(db.Products().FirstOrDefault(p => p.Id == productId)!);
    }

    // Soft delete- hides the listing from the vendor's list and the market,
// but keeps the row so order history still points to it
    public void DeleteProduct(int id, string callerId, bool isAdmin)
    {
        Product? product = db.Products().FirstOrDefault(p => p.Id == id && !p.IsDeleted);
        if (product is null)
            throw new NotFoundException("Product with id = " + id + " was not found.");

        if (!isAdmin && product.VendorId != callerId)
            throw new ForbiddenException("You do not have permission to modify this product.");

        db.Products()
            .Where(p => p.Id == id)
            .Set(p => p.IsDeleted, true)
            .Set(p => p.IsActive, false)
            .Set(p => p.UpdatedAtUtc, DateTime.UtcNow)
            .Update();
    }
    
    public ProductResponseDTO SetProductActive(int id, bool isActive, string callerId, bool isAdmin)
    {
        Product? product = db.Products().FirstOrDefault(p => p.Id == id && (isAdmin || !p.IsDeleted));
        if (product is null)
            throw new NotFoundException("Product with id = " + id + " was not found.");

        if (!isAdmin && product.VendorId != callerId)
            throw new ForbiddenException("You do not have permission to modify this product.");
     
        if (isActive && loginDb.Users.Any(u => u.UserId == product.VendorId && !u.IsActive))
            throw new BadRequestException("This vendor has been seized by the FBI. Their listings can't be reactivated.");
        
        bool byAdmin = isAdmin && product.VendorId != callerId;

        var update = db.Products()
            .Where(p => p.Id == id)
            .Set(p => p.UpdatedAtUtc, DateTime.UtcNow);

        if (byAdmin && isActive && product.IsDeleted)
        {
            update = update
                .Set(p => p.IsDeleted, false)
                .Set(p => p.IsActive, false)
                .Set(p => p.RestoredByAdminAtUtc, DateTime.UtcNow)
                .Set(p => p.AdminNotice, "Restored");
        }
        else if (byAdmin && isActive)
        {
            update = update
                .Set(p => p.IsActive, true)
                .Set(p => p.RestoredByAdminAtUtc, (DateTime?)null)
                .Set(p => p.AdminNotice, "Reactivated");
        }
        else
        {
            update = update
                .Set(p => p.IsActive, isActive)
                .Set(p => p.RestoredByAdminAtUtc, (DateTime?)null);
        }

        update.Update();
        return GetProduct(id, callerId, isAdmin);
    }
    
    // Image CRUD
    
    public ProductImageDataDTO GetImageData(int imageId, string callerId, bool isAdmin)
    {
        var image = db.ProductImages().FirstOrDefault(i => i.Id == imageId);

        if (image is null)
            throw new NotFoundException("Image with id = " + imageId + " was not found.");

        var product = db.Products().FirstOrDefault(p => p.Id == image.ProductId);
        if (product is null || (product.Status != "Approved" && !isAdmin && product.VendorId != callerId))
            throw new NotFoundException("Image with id = " + imageId +
                                        " was not found - because it's belonging product was not found.");
        
        return new ProductImageDataDTO
            {
                Data = image.Image,
                Extension = image.Extension
            };
    }
    
    public List<ProductImageDTO> AddImages(int productId, List<ProductImageDataDTO> files, string callerId, bool isAdmin)
    {
        EnsureNotSeized(callerId);
        var product = db.Products().FirstOrDefault(p => p.Id == productId);
        if (product is null)
            throw new NotFoundException("Product with id = " + productId + " was not found.");
        
        if (!isAdmin && product.VendorId != callerId)
            throw new ForbiddenException("You do not have permission to add images to this product.");
        
        int nextSortOrder = db.ProductImages().Count(i => i.ProductId == productId);
        bool hasPrimaryAlready = db.ProductImages().Any(i => i.ProductId == productId && i.IsPrimary);

        var saved = new List<ProductImageDTO>();

        foreach (var file in files)
        {
            var image = new ProductImage
            {
                ProductId = productId,
                Extension = file.Extension,
                Image = file.Data,
                IsPrimary = !hasPrimaryAlready,
                SortOrder = nextSortOrder
            };

            image.Id = db.InsertWithInt32Identity(image);
            
            saved.Add(new ProductImageDTO
            {
                Id = image.Id,
                Extension = image.Extension,
                IsPrimary = image.IsPrimary,
                SortOrder = image.SortOrder
            });

            hasPrimaryAlready = true;
            nextSortOrder++;
        }

        if (!isAdmin && saved.Count > 0)
            db.Products()
                .Where(p => p.Id == productId)
                .Set(p => p.Status, "Pending")
                .Update();

        return saved;
    }

    public void DeleteImage(int imageId, string callerId, bool isAdmin)
    {
        var image = db.ProductImages().FirstOrDefault(i => i.Id == imageId);
        if (image is null)
            throw new NotFoundException("Image with id = " + imageId + " was not found.");

        var product = db.Products().FirstOrDefault(p => p.Id == image.ProductId);
        if (!isAdmin && product is not null && product.VendorId != callerId)
            throw new ForbiddenException("You do not have permission to delete this image.");
        
        db.ProductImages().Where(i => i.Id == imageId).Delete();
    }

    // Helpers
    
    private void EnsureCategoryExists(int categoryId)
    {
        if (!db.Categories().Any(c => c.Id == categoryId))
            throw new BadRequestException("Category with id = " + categoryId + " does not exist.");
    }
    
    private Dictionary<string, string> UsernamesFor(IEnumerable<string> userIds)
    {
        var ids = userIds.Distinct().ToList();
        return loginDb.Users
            .Where(u => ids.Contains(u.UserId))
            .ToDictionary(u => u.UserId, u => u.Username);
    }
    private HashSet<string> SeizedVendorsFor(IEnumerable<string> userIds)
    {
        var ids = userIds.Distinct().ToList();
        return loginDb.Users
            .Where(u => ids.Contains(u.UserId) && !u.IsActive)
            .Select(u => u.UserId)
            .ToHashSet();
    }
    private List<string> BlockedVendorIds() =>
        loginDb.Users.Where(u => u.IsBlocked).Select(u => u.UserId).ToList();


    private List<ProductResponseDTO> ToDtos(List<Product> products)
    {
        var vendorIds = products.Select(p => p.VendorId).ToList();
        var usernames = UsernamesFor(vendorIds);
        var seized = SeizedVendorsFor(vendorIds);
        return products.Select(p => ToDto(p, usernames, seized)).ToList();
    }

    private ProductResponseDTO ToDto(Product p) => ToDtos([p])[0];

    private static ProductResponseDTO ToDto(Product p, IReadOnlyDictionary<string, string> usernames, IReadOnlySet<string> seized) => new()
    {
        Id = p.Id,
        Title = p.Title,
        Description = p.Description,
        Price = p.Price,
        Stock = p.Stock,
        CategoryId = p.CategoryId,
        VendorId = p.VendorId,
        VendorUsername = usernames.GetValueOrDefault(p.VendorId, ""),
        VendorSeized = seized.Contains(p.VendorId),
        Status = p.Status,
        IsActive = p.IsActive,
        RestoredByAdminAtUtc = p.RestoredByAdminAtUtc,
        AdminNotice = p.AdminNotice,
        Images = p.Images.Select(i => new ProductImageDTO
        {
            Id = i.Id,
            IsPrimary = i.IsPrimary,
            SortOrder = i.SortOrder,
            Extension = i.Extension
        }).ToList()
    };
    
    private static void IsProductValid(ProductRequestDTO dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) )
            throw new BadRequestException("Don't forget a title");
        if (dto.Title.Trim().Length > 100)
            throw new BadRequestException("Title is too long. 100 characters max.");
        if ((dto.Description ?? "").Length > 2000)
            throw new BadRequestException("Description is too long. 2000 characters max.");
        if (dto.Price <= 0)
            throw new BadRequestException("Price must be greater than 0.");
        if (dto.Stock < 0)
            throw new BadRequestException("Stock cannot be negative.");
        if (dto.CategoryId <= 0)
            throw new BadRequestException("Choose a category.");
    }
    public ProductResponseDTO UpdateStock(int id, int stock, string callerId, bool isAdmin)
    {
        if (stock < 0)
            throw new BadRequestException("Stock cannot be negative.");

        Product? product = db.Products().FirstOrDefault(p => p.Id == id &&!p.IsDeleted);
        if (product is null)
            throw new NotFoundException("Product with id = " + id + " was not found.");

        if (!isAdmin && product.VendorId != callerId)
            throw new ForbiddenException("You do not have permission to modify this product.");

        // Only stock changes so no need for Admin to approve again
        db.Products()
            .Where(p => p.Id == id)
            .Set(p => p.Stock, stock)
            .Set(p => p.UpdatedAtUtc, DateTime.UtcNow)
            .Update();

        return GetProduct(id, callerId, isAdmin);
    }
    public void ClearAdminNotices(string vendorId)
    {
        db.Products()
            .Where(p => p.VendorId == vendorId && p.AdminNotice != null)
            .Set(p => p.AdminNotice, (string?)null)
            .Update();
    }
}