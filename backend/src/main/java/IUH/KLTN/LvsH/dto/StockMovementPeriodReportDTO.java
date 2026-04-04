package IUH.KLTN.LvsH.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class StockMovementPeriodReportDTO {
    Long warehouseId;
    Long productId;
    String productSku;
    String productName;
    Integer openingQty;
    Integer inQty;
    Integer outQty;
    Integer closingQty;
}
