package IUH.KLTN.LvsH.dto.supplier;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SupplierRequestDTO {
    // Để trống → trigger SQL tự sinh theo format NCC-XXXXX
    private String supplierCode;

    @NotBlank(message = "Vui lòng nhập tên nhà cung cấp")
    private String name;
    
    private String phone;
    private String taxCode;
    private String address;
    private Boolean isActive;
}
