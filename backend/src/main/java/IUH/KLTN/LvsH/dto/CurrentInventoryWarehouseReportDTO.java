package IUH.KLTN.LvsH.dto;

import lombok.Builder;
import lombok.Value;
import java.math.BigDecimal;

@Value
@Builder
public class CurrentInventoryWarehouseReportDTO {
    Long warehouseId;
    String warehouseName;
    Long productId;
    String sku;
    String productName;
    String categoryName;
    Integer onHand;
    BigDecimal avgCost;
    BigDecimal salePrice;
    BigDecimal totalValue; // onHand * avgCost
    String status; // "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"
}
