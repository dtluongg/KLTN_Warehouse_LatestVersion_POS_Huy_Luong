package IUH.KLTN.LvsH.backend_refactor.dto;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDate;

@Value
@Builder
public class StockAdjustmentSummaryReportDTO {
    Long adjustmentId;
    String adjustNo;
    LocalDate adjustDate;
    Long warehouseId;
    String warehouseName;
    String reason;
    String status;
    Integer totalIncreaseQty;
    Integer totalDecreaseQty;
    Integer netDiffQty;
    BigDecimal estimatedValueImpact;
}
