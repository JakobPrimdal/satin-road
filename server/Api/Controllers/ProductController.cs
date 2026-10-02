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
        return service.GetProduct(id);
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
        service.DeleteProduct(id);
        return NoContent();
    }
    
    
    // Image CRUD

    [HttpGet(nameof(GetImage))]
    public IActionResult GetImage(int imageId)
    {
        var image = service.GetImageData(imageId);

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
        service.DeleteImage(imageId);
        return NoContent();
    }
}