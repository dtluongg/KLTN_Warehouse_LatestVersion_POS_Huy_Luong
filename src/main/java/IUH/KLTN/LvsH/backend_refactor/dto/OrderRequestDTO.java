package IUH.KLTN.LvsH.backend_refactor.dto;

import IUH.KLTN.LvsH.backend_refactor.enums.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class OrderRequestDTO {
    private UUID customerId;
    private Long warehouseId;
    private BigDecimal discountAmount;
    private String couponCode;
    private BigDecimal surchargeAmount;
    private PaymentMethod paymentMethod;
    private String note;
    private List<ItemRequestDTO> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemRequestDTO {
        private Long productId;
        private Integer quantity;
        private BigDecimal salePrice;
    }
}
