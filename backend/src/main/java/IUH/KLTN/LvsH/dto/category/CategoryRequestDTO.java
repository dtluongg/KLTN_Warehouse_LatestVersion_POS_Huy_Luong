package IUH.KLTN.LvsH.dto.category;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CategoryRequestDTO {
    @NotBlank(message = "Vui lòng nhập tên danh mục")
    private String name;
    
    @NotBlank(message = "Vui lòng nhập đường dẫn (slug)")
    private String slug;
    
    private Boolean isActive;
}
