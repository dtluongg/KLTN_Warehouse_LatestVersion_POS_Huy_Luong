package IUH.KLTN.LvsH.dto.category;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategoryResponseDTO {
    private Long id;
    private String name;
    private String slug;
    private Boolean isActive;
}
