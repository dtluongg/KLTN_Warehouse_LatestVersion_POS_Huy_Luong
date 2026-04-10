package IUH.KLTN.LvsH.dto.staff;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class StaffResponseDTO {
    private Long id;
    private String staffCode;
    private String fullName;
    private String phone;
    private String email;
    private String taxCode;
    private String address;
    private LocalDate hireDate;
    private String username;
    private String role;
    private Boolean isActive;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
}
