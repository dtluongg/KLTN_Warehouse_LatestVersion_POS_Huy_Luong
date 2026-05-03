package IUH.KLTN.LvsH.dto.staff;

import IUH.KLTN.LvsH.enums.Role;
import lombok.Data;

@Data
public class StaffSearchCriteria {
    private String keyword;
    private Role role;
    private Boolean isActive;
}
