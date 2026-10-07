using Service.Dtos;

namespace Service;

public interface ICategoryService
{
    public List<CategoryResponseDTO> GetCategories();

    public CategoryResponseDTO GetCategory(int id);

    public CategoryResponseDTO CreateCategory(CategoryRequestDTO dto);

    public CategoryResponseDTO UpdateCategory(int id, CategoryRequestDTO dto);

    public void DeleteCategory(int id);
}