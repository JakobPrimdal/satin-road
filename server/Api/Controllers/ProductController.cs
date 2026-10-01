using Microsoft.AspNetCore.Mvc;
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
}