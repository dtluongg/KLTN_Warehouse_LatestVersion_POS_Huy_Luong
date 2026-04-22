package IUH.KLTN.LvsH.dto;

import lombok.Builder;
import lombok.Value;
import java.math.BigDecimal;
import java.time.LocalDate;

@Value
@Builder
public class SlowMovingProductReportDTO {
    Long warehouseId;
    String warehouseName;
    Long productId;
    String sku;
    String productName;
    Integer onHand;
    BigDecimal inventoryValue; // onHand * avgCost
    Integer daysSinceLastMovement; // số ngày không phát sinh xuất
    LocalDate lastMovementDate; // lần cuối bán hoặc xuất
    String riskCategory; // "DEAD_STOCK" (>90 ngày), "SLOW_MOVING" (30-90), "NORMAL"
}
