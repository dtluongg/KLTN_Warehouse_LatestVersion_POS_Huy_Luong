package IUH.KLTN.LvsH.backend_refactor.dto;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class CurrentInventoryReportDTO {
    Long productId;
    String sku;
    String barcode;
    String name;
    String shortName;
    Long categoryId;
    BigDecimal salePrice;
    BigDecimal avgCost;
    Integer onHand;
    String imageUrl;
}
