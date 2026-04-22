package IUH.KLTN.LvsH.dto;

import lombok.Builder;
import lombok.Value;
import java.math.BigDecimal;

@Value
@Builder
public class DaysOfCoverageReportDTO {
    Long warehouseId;
    String warehouseName;
    Long productId;
    String sku;
    String productName;
    Integer onHand;
    BigDecimal avgDailyDemand; // bán trung bình mỗi ngày
    Integer daysOfCoverage; // tồn / nhu cầu trung bình ngày (làm tròn)
    String riskLevel; // "CRITICAL" (< 3 ngày), "WARNING" (3-7), "SAFE" (> 7)
}
