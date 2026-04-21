package IUH.KLTN.LvsH.dto.staff;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDate;

@Data
public class StaffRequestDTO {
    // Để trống → trigger SQL tự sinh theo format NV-XXXXX
    private String staffCode;

    @NotBlank(message = "Vui lòng nhập tên nhân viên")
    private String fullName;
    
    private String phone;
    private String email;
    private String taxCode;
    private String address;
    private LocalDate hireDate;
    
    @NotBlank(message = "Vui lòng nhập tên đăng nhập")
    private String username;
    
    private String password;
    
    @NotBlank(message = "Vui lòng chọn chức vụ")
    private String role;
    
    private Boolean isActive;
}
