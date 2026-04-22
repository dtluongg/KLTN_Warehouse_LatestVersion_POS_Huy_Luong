package IUH.KLTN.LvsH.dto;

import lombok.Builder;
import lombok.Value;
import java.math.BigDecimal;

@Value
@Builder
public class InventoryValueReportDTO {
    Long warehouseId;
    String warehouseName;
    Long productId;
    String sku;
    String productName;
    Integer onHand;
    BigDecimal avgCost;
    BigDecimal totalValue; // onHand * avgCost
    String category;
}
