package IUH.KLTN.LvsH.dto.product;

import lombok.Data;

@Data
public class ProductSearchCriteria {
    private String keyword; 
    private Long categoryId;
    private Boolean isActive;
}
