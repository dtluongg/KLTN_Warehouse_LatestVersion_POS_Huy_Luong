package IUH.KLTN.LvsH.dto.customer;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CustomerRequestDTO {
    @NotBlank(message = "Vui lòng nhập mã khách hàng")
    private String customerCode;

    @NotBlank(message = "Vui lòng nhập tên khách hàng")
    private String name;
    
    private String phone;
    private String email;
    private String taxCode;
    private String address;
    private Boolean isActive;
}
