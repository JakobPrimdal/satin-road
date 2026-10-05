using Infrastructure;
using Infrastructure.Entities;
using LinqToDB;
using Service.Dtos;
using Service.Exceptions;

namespace Service;

public class ProductService: IProductService
{
    private readonly ProductDb db;

    public ProductService(ProductDb db)
    {
        this.db = db;
    }
    
    public List<ProductResponseDTO> GetProducts()
    {
        List<Product> allProducts = db.Products()
            .LoadWith(p => p.Images)
            .ToList();

        List<ProductResponseDTO> completeProducts = new();

        foreach (var p in allProducts)
        {
            completeProducts.Add(ToDto(p));
        }

        return completeProducts;
    }

    public ProductResponseDTO GetProduct(int id)
    {
        Product? product = db.Products()
            .LoadWith(p => p.Images)
            .FirstOrDefault(p => p.Id == id);

        return product is null ? 
            throw new NotFoundException("Product with id = " + id + " was not found.") 
            : ToDto(product);
    }

    public List<ProductResponseDTO> SearchProducts(string search)
    {
        if (string.IsNullOrWhiteSpace(search))
            return GetProducts();

        List<Product> matches = db.Products()
            .LoadWith(p => p.Images)
            .Where(p => p.Title.Contains(search) || p.Description.Contains(search))
            .ToList();

        return matches.Select(ToDto).ToList();
    }

    public ProductResponseDTO CreateProduct(ProductRequestDTO dto, string vendorId)
    {
        Product product = new Product()
        {
            Title = dto.Title,
            Description = dto.Description,
            Price = dto.Price,
            Stock = dto.Stock,
            CategoryId = dto.CategoryId,
            VendorId = vendorId,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        product.Id = db.InsertWithInt32Identity(product);

        return ToDto(product);
    }

    public ProductResponseDTO UpdateProduct(int id, ProductRequestDTO dto, string callerId, bool isAdmin)
    {
        Product? product = db.Products().FirstOrDefault(p => p.Id == id);
        if (product is null)
            throw new NotFoundException("Product with id = " + id + " was not found.");

        if (!isAdmin && product.VendorId != callerId)
            throw new ForbiddenException("You do not have permission to modify this product.");

        product.Title = dto.Title;
        product.Description = dto.Description;
        product.Price = dto.Price;
        product.Stock = dto.Stock;
        product.CategoryId = dto.CategoryId;
        product.UpdatedAtUtc = DateTime.UtcNow;

        db.Update(product);

        return GetProduct(id);
    }

    public void DeleteProduct(int id, string callerId, bool isAdmin)
    {
        Product? product = db.Products().FirstOrDefault(p => p.Id == id);
        if (product is null)
            throw new NotFoundException("Product with id = " + id + " was not found.");

        if (!isAdmin && product.VendorId != callerId)
            throw new ForbiddenException("You do not have permission to modify this product.");

        db.ProductImages().Where(i => i.ProductId == id).Delete();
        db.Products().Where(p => p.Id == id).Delete();
    }

    
    // Image CRUD
    
    public ProductImageDataDTO GetImageData(int imageId)
    {
        var image = db.ProductImages().FirstOrDefault(i => i.Id == imageId);
        
        return image is null ? 
            throw new NotFoundException("Image with id = " + imageId + " was not found.") 
            : new ProductImageDataDTO
            {
                Data = image.Image,
                Extension = image.Extension
            };
    }
    
    public List<ProductImageDTO> AddImages(int productId, List<ProductImageDataDTO> files, string callerId, bool isAdmin)
    {
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

    private static ProductResponseDTO ToDto(Product p) => new()
    {
        Id = p.Id,
        Title = p.Title,
        Description = p.Description,
        Price = p.Price,
        Stock = p.Stock,
        CategoryId = p.CategoryId,
        VendorId = p.VendorId,
        Images = p.Images.Select(i => new ProductImageDTO
        {
            Id = i.Id,
            IsPrimary = i.IsPrimary,
            SortOrder = i.SortOrder,
            Extension = i.Extension
        }).ToList()
    };
}