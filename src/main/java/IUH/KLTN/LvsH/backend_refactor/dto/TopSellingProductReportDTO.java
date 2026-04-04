package IUH.KLTN.LvsH.backend_refactor.dto;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class TopSellingProductReportDTO {
    Long productId;
    String sku;
    String productName;
    Long soldQty;
    BigDecimal revenue;
    BigDecimal profit;
}
