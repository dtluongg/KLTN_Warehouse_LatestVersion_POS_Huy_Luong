package IUH.KLTN.LvsH.dto.supplier;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class SupplierResponseDTO {
    private UUID id;
    private String supplierCode;
    private String name;
    private String phone;
    private String taxCode;
    private String address;
    private Boolean isActive;
}
