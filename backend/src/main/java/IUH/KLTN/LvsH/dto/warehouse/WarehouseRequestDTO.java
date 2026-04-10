package IUH.KLTN.LvsH.dto.warehouse;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class WarehouseRequestDTO {
    @NotBlank(message = "Vui lòng nhập mã kho")
    private String code;
    
    @NotBlank(message = "Vui lòng nhập tên kho")
    private String name;
    
    private String address;
    private Boolean isActive;
}
