using Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Service;
using Service.Dtos;

namespace Api.Controllers;

[ApiController]
[Authorize]
public class ProductController(ProductService service) : ControllerBase
{
    [HttpGet(nameof(GetProducts))]
    public List<ProductResponseDTO> GetProducts()
    {
        return service.GetProducts(User.GetUserId());
    }

    [HttpGet(nameof(GetMyProducts))]
    public List<ProductResponseDTO> GetMyProducts()
    {
        return service.GetMyProducts(User.GetUserId());
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpGet(nameof(GetPendingProducts))]
    public List<ProductResponseDTO> GetPendingProducts()
    {
        return service.GetPendingProducts();
    }

    [HttpGet(nameof(GetProduct))]
    public ActionResult<ProductResponseDTO> GetProduct(int id)
    {
        return service.GetProduct(id, User.GetUserId(), User.IsAdmin());
    }

    [HttpGet(nameof(SearchProducts))]
    public List<ProductResponseDTO> SearchProducts(string search)
    {
        return service.SearchProducts(search, User.GetUserId());
    }

    [HttpPost(nameof(CreateProduct))]
    public ProductResponseDTO CreateProduct([FromForm] ProductRequestDTO dto)
    {
        return service.CreateProduct(dto, User.GetUserId(), User.IsAdmin());
    }

    [HttpPut(nameof(UpdateProduct))]
    public ProductResponseDTO UpdateProduct(int id, [FromForm] ProductRequestDTO dto)
    {
        return service.UpdateProduct(id, dto, User.GetUserId(), User.IsAdmin());
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpPut(nameof(SetProductApproval))]
    public ProductResponseDTO SetProductApproval(int productId, string status)
    {
        return service.SetProductApproval(productId, status);
    }

    [HttpDelete(nameof(DeleteProduct))]
    public IActionResult DeleteProduct(int id)
    {
        service.DeleteProduct(id, User.GetUserId(), User.IsAdmin());
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

        return service.AddImages(productId, uploads, User.GetUserId(), User.IsAdmin());
    }

    [HttpDelete(nameof(DeleteImage))]
    public IActionResult DeleteImage(int imageId)
    {
        service.DeleteImage(imageId, User.GetUserId(), User.IsAdmin());
        return NoContent();
    }
}