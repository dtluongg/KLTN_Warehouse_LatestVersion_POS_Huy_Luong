package IUH.KLTN.LvsH.backend_refactor.dto;

import IUH.KLTN.LvsH.backend_refactor.enums.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
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

    @NotNull(message = "warehouseId is required")
    private Long warehouseId;

    @NotNull(message = "discountAmount is required")
    @PositiveOrZero(message = "discountAmount must be >= 0")
    private BigDecimal discountAmount;

    private String couponCode;

    @NotNull(message = "surchargeAmount is required")
    @PositiveOrZero(message = "surchargeAmount must be >= 0")
    private BigDecimal surchargeAmount;

    @NotNull(message = "paymentMethod is required")
    private PaymentMethod paymentMethod;

    private String note;

    @NotEmpty(message = "items are required")
    @Valid
    private List<ItemRequestDTO> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemRequestDTO {
        @NotNull(message = "productId is required")
        private Long productId;

        @NotNull(message = "quantity is required")
        @Positive(message = "quantity must be greater than 0")
        private Integer quantity;

        @NotNull(message = "salePrice is required")
        @PositiveOrZero(message = "salePrice must be >= 0")
        private BigDecimal salePrice;
    }
}
