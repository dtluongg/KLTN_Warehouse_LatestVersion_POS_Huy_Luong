package IUH.KLTN.LvsH.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class LowStockAlertReportDTO {
    Long warehouseId;
    Long productId;
    String sku;
    String productName;
    Integer onHand;
    Integer threshold;
    Integer shortageQty;
}
