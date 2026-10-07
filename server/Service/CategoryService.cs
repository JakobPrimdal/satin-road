using Infrastructure;
using Infrastructure.Entities;
using LinqToDB;
using Service.Dtos;
using Service.Exceptions;

namespace Service;

public class CategoryService : ICategoryService
{
    private readonly ProductDb db;

    public CategoryService(ProductDb db)
    {
        this.db = db;
    }
    
    public List<CategoryResponseDTO> GetCategories()
    {
        return db.Categories()
            .OrderBy(c => c.Name)
            .ToList()
            .Select(ToDto)
            .ToList();
    }

    public CategoryResponseDTO GetCategory(int id)
    {
        Category? category = db.Categories().FirstOrDefault(c => c.Id == id);

        return category is null
            ? throw new NotFoundException("Category with id = " + id + " was not found.")
            : ToDto(category);
    }

    public CategoryResponseDTO CreateCategory(CategoryRequestDTO dto)
    {
        string name = ValidateName(dto.Name);
        EnsureNameIsFree(name);

        Category category = new Category { Name = name };
        category.Id = db.InsertWithInt32Identity(category);

        return ToDto(category);
    }

    public CategoryResponseDTO UpdateCategory(int id, CategoryRequestDTO dto)
    {
        Category? category = db.Categories().FirstOrDefault(c => c.Id == id);
        if (category is null)
            throw new NotFoundException("Category with id = " + id + " was not found");

        string name = ValidateName(dto.Name);
        EnsureNameIsFree(name, id);

        category.Name = name;
        db.Update(category);

        return ToDto(category);
    }

    public void DeleteCategory(int id)
    {
        Category? category = db.Categories().FirstOrDefault(c => c.Id == id);
        if (category is null)
            throw new NotFoundException("Category with id = " + id + " was not found.");

        int productCount = db.Products().Count(p => p.CategoryId == id);
        if (productCount > 0)
            throw new BadRequestException("Category with id = " + id + " cannot be deleted because " + productCount +
                                          " product(s) use it.");

        db.Categories().Where(c => c.Id == id).Delete();
    }

    private string ValidateName(string name)
    {
        string trimmed = name.Trim();

        if (trimmed.Length == 0)
            throw new BadRequestException("Category name is required.");
        if (trimmed.Length > 255)
            throw new BadRequestException("Category name cannot be longer than 255 characters.");

        return trimmed;
    }

    private void EnsureNameIsFree(string name, int excludeId = 0)
    {
        string lowered = name.ToLower();

        bool taken = db.Categories().Any(c => c.Name.ToLower() == lowered && c.Id != excludeId);
        if (taken)
            throw new BadRequestException("A category named '" + name + "' already exists.");
    }
    
    private static CategoryResponseDTO ToDto(Category c) => new()
    {
        Id = c.Id,
        Name = c.Name
    };
}