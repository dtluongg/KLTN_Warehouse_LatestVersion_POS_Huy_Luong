package IUH.KLTN.LvsH.dto.customer;

import lombok.Data;

@Data
public class CustomerSearchCriteria {
    private String keyword; 
    private Boolean isActive;
}
