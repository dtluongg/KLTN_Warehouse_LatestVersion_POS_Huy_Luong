package IUH.KLTN.LvsH.dto.product;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class ProductResponseDTO {
    private Long id;
    private String sku;
    private String barcode;
    private String name;
    private String shortName;
    private Long categoryId;
    private String categoryName;
    private BigDecimal salePrice;
    private BigDecimal avgCost;
    private BigDecimal lastPurchaseCost;
    private BigDecimal vatRate;
    private String imageUrl;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
