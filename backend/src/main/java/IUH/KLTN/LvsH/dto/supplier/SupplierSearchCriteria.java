package IUH.KLTN.LvsH.dto.supplier;

import lombok.Data;

@Data
public class SupplierSearchCriteria {
    private String keyword; 
    private Boolean isActive;
}
