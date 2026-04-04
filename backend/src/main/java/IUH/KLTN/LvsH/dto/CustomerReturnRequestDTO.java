package IUH.KLTN.LvsH.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class CustomerReturnRequestDTO {
    private String returnNo;

    @NotBlank(message = "customerId is required")
    private String customerId; // UUID

    private Long orderId; // CÃ³ thá»ƒ null náº¿u khÃ¡ch tráº£ tá»± do
    private String note;

    @NotNull(message = "warehouseId is required")
    private Long warehouseId;

    @NotEmpty(message = "items are required")
    @Valid
    private List<ReturnItemRequestDTO> items;

    @Data
    public static class ReturnItemRequestDTO {
        private Long orderItemId; // CÃ³ thá»ƒ null 

        @NotNull(message = "productId is required")
        private Long productId;

        @NotNull(message = "qty is required")
        @Positive(message = "qty must be greater than 0")
        private Integer qty;

        @NotNull(message = "refundAmount is required")
        @PositiveOrZero(message = "refundAmount must be >= 0")
        private BigDecimal refundAmount;
    }
}
