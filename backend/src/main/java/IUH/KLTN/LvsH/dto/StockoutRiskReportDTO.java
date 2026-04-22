package IUH.KLTN.LvsH.dto;

import lombok.Builder;
import lombok.Value;
import java.math.BigDecimal;
import java.time.LocalDate;

@Value
@Builder
public class StockoutRiskReportDTO {
    Long warehouseId;
    String warehouseName;
    Long productId;
    String sku;
    String productName;
    Integer onHand;
    BigDecimal avgDailyDemand;
    LocalDate estimatedStockoutDate; // ngày dự kiến hết hàng
    Integer daysUntilStockout; // số ngày tới khi hết
    String priority; // "CRITICAL", "HIGH", "MEDIUM", "SAFE"
}
