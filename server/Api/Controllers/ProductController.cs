using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Service;
using Service.Dtos;

namespace Api.Controllers;

[ApiController]
public class ProductController(ProductService service) : ControllerBase
{
    [HttpGet(nameof(GetProducts))]
    public List<ProductResponseDTO> GetProducts()
    {
        return service.GetProducts();
    }

    [HttpGet(nameof(GetProduct))]
    public ActionResult<ProductResponseDTO> GetProduct(int id)
    {
        var product = service.GetProduct(id);
        return product is null ? NotFound() : Ok(product);
    }

    [HttpGet(nameof(SearchProducts))]
    public List<ProductResponseDTO> SearchProducts(string search)
    {
        return service.SearchProducts(search);
    }

    [HttpPost(nameof(CreateProduct))]
    public ProductResponseDTO CreateProduct([FromForm] ProductRequestDTO dto)
    {
        return service.CreateProduct(dto);
    }

    [HttpPut(nameof(UpdateProduct))]
    public ProductResponseDTO UpdateProduct(int id, [FromForm] ProductRequestDTO dto)
    {
        return service.UpdateProduct(id, dto);
    }

    [HttpDelete(nameof(DeleteProduct))]
    public IActionResult DeleteProduct(int id)
    {
        var deleted = service.DeleteProduct(id);
        return deleted ? NoContent() : NotFound();
    }
    
    
    // Image CRUD

    [HttpGet(nameof(GetImage))]
    public IActionResult GetImage(int imageId)
    {
        var image = service.GetImageData(imageId);
        if (image is null)
            return NotFound();

        var contentTypeProvider = new FileExtensionContentTypeProvider();
        if (!contentTypeProvider.TryGetContentType("file" + image.Extension, out var contentType))
            contentType = "application/octet-stream";

        return File(image.Data, contentType);
    }

    [HttpPost(nameof(UploadImages))]
    public List<ProductImageDTO> UploadImages(int productId, List<IFormFile> files)
    {
        var uploads = new List<ProductImageDataDTO>();

        foreach (var file in files)
        {
            using var stream = new MemoryStream();
            file.CopyTo(stream);
            
            uploads.Add(new ProductImageDataDTO
            {
                Data = stream.ToArray(),
                Extension = Path.GetExtension(file.FileName)
            });
        }

        return service.AddImages(productId, uploads);
    }

    [HttpDelete(nameof(DeleteImage))]
    public IActionResult DeleteImage(int imageId)
    {
        var deleted = service.DeleteImage(imageId);
        return deleted ? NoContent() : NotFound();
    }
}