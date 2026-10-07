namespace Service.Dtos;

public class ProductImageDTO
{
    public int Id { get; set; }
    public bool IsPrimary { get; set; }
    public int SortOrder { get; set; }
    public string Extension { get; set; } = "";
}