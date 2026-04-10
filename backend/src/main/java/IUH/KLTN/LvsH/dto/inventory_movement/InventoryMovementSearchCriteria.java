package IUH.KLTN.LvsH.dto.inventory_movement;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class InventoryMovementSearchCriteria {
    private String keyword; // product name, sku, refId
    private Long warehouseId;
    private String movementType;
    private LocalDateTime fromDate;
    private LocalDateTime toDate;
}
