package IUH.KLTN.LvsH.dto.category;

import lombok.Data;

@Data
public class CategorySearchCriteria {
    private String keyword; 
    private Boolean isActive;
}
