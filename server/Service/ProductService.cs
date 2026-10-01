using Infrastructure;
using Infrastructure.Entities;
using LinqToDB;
using Service.Dtos;

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

    public ProductResponseDTO? GetProduct(int id)
    {
        Product? product = db.Products()
            .LoadWith(p => p.Images)
            .FirstOrDefault(p => p.Id == id);

        return product is null ? null : ToDto(product);
    }

    public ProductResponseDTO CreateProduct(ProductRequestDTO dto)
    {
        Product product = new Product()
        {
            Title = dto.Title,
            Description = dto.Description,
            Price = dto.Price,
            Stock = dto.Stock,
            CategoryId = dto.CategoryId,
            VendorId = dto.VendorId,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        product.Id = db.InsertWithInt32Identity(product);

        return ToDto(product);
    }

    public ProductResponseDTO? UpdateProduct(int id, ProductRequestDTO dto)
    {
        Product? product = db.Products().FirstOrDefault(p => p.Id == id);
        if (product is null)
            return null;

        product.Title = dto.Title;
        product.Description = dto.Description;
        product.Price = dto.Price;
        product.Stock = dto.Stock;
        product.CategoryId = dto.CategoryId;
        product.VendorId = dto.VendorId;
        product.UpdatedAtUtc = DateTime.UtcNow;

        db.Update(product);

        return GetProduct(id);
    }

    public bool DeleteProduct(int id)
    {
        Product? product = db.Products().FirstOrDefault(p => p.Id == id);
        if (product is null)
            return false;

        db.ProductImages().Where(i => i.ProductId == id).Delete();
        db.Products().Where(p => p.Id == id).Delete();

        return true;
    }

    
    // Image CRUD
    
    public ProductImageDataDTO? GetImageData(int imageId)
    {
        var image = db.ProductImages().FirstOrDefault(i => i.Id == imageId);
        
        return image is null ? null : new ProductImageDataDTO
        {
            Data = image.Image,
            Extension = image.Extension
        };
    }
    
    public List<ProductImageDTO> AddImages(int productId, List<ProductImageDataDTO> files)
    {
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

    public bool DeleteImage(int imageId)
    {
        return db.ProductImages().Where(i => i.Id == imageId).Delete() > 0;
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