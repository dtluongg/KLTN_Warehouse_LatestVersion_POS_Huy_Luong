package IUH.KLTN.LvsH.dto.staff;

import lombok.Data;

@Data
public class StaffSearchCriteria {
    private String keyword; 
    private String role;
    private Boolean isActive;
}
