package IUH.KLTN.LvsH.dto.supplier_product;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class SupplierProductResponseDTO {
    private Long id;

    private UUID supplierId;
    private String supplierName;

    private Long productId;
    private String productSku;
    private String productName;
    private BigDecimal vatRate;

    private BigDecimal standardPrice;
    private Boolean isActive;
    private LocalDateTime lastUpdatedAt;
    private LocalDateTime createdAt;
}
