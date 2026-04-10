package IUH.KLTN.LvsH.dto.inventory_movement;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class InventoryMovementResponseDTO {
    private Long id;
    private Long productId;
    private String productSku;
    private String productName;
    private Long warehouseId;
    private String warehouseName;
    private String movementType;
    private Integer qty;
    private String refTable;
    private String refId;
    private String note;
    private String createdBy;
    private LocalDateTime createdAt;
}
