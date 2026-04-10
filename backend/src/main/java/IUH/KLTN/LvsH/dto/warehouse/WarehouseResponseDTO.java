package IUH.KLTN.LvsH.dto.warehouse;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WarehouseResponseDTO {
    private Long id;
    private String code;
    private String name;
    private String address;
    private Boolean isActive;
}
