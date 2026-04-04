package IUH.KLTN.LvsH.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import IUH.KLTN.LvsH.enums.DocumentStatus;
import IUH.KLTN.LvsH.enums.PaymentMethod;
import java.math.BigDecimal;
import java.util.List;

@Data
public class OrderResponseDTO {
    private Long id;
    private String orderNo;
    private DocumentStatus status;
    private BigDecimal netAmount;
    private PaymentMethod paymentMethod;
    private List<ItemResponseDTO> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemResponseDTO {
        private Long id;
        private Integer qty;
        private BigDecimal salePrice;
        private BigDecimal lineRevenue;
        private ProductLiteDTO product;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductLiteDTO {
        private Long id;
        private String sku;
        private String name;
    }
}
