using Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Service;
using Service.Dtos;

namespace Api.Controllers;

[ApiController]
[Authorize]
public class CategoryController(CategoryService service) : ControllerBase
{
    [HttpGet(nameof(GetCategories))]
    public List<CategoryResponseDTO> GetCategories()
    {
        return service.GetCategories();
    }

    [HttpGet(nameof(GetCategory))]
    public CategoryResponseDTO GetCategory(int id)
    {
        return service.GetCategory(id);
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpPost(nameof(CreateCategory))]
    public CategoryResponseDTO CreateCategory(CategoryRequestDTO dto)
    {
        return service.CreateCategory(dto);
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpPut(nameof(UpdateCategory))]
    public CategoryResponseDTO UpdateCategory(int id, CategoryRequestDTO dto)
    {
        return service.UpdateCategory(id, dto);
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpDelete(nameof(DeleteCategory))]
    public IActionResult DeleteCategory(int id)
    {
        service.DeleteCategory(id);
        return NoContent();
    }
}