package IUH.KLTN.LvsH.dto.warehouse;

import lombok.Data;

@Data
public class WarehouseSearchCriteria {
    private String keyword; 
    private Boolean isActive;
}
