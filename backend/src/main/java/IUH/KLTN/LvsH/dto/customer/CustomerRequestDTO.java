package IUH.KLTN.LvsH.dto.customer;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CustomerRequestDTO {
    // Để trống → trigger SQL tự sinh theo format KH-XXXXX
    private String customerCode;

    @NotBlank(message = "Vui lòng nhập tên khách hàng")
    private String name;
    
    private String phone;
    private String email;
    private String taxCode;
    private String address;
    private Boolean isActive;
}
