package IUH.KLTN.LvsH.backend_refactor.dto;

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
public class SupplierReturnRequestDTO {
    private Long goodsReceiptId; // Phiáº¿u nháº­p gá»‘c (cÃ³ thá»ƒ null náº¿u tráº£ tá»± do)

    @NotBlank(message = "supplierId is required")
    private String supplierId;   // UUID

    private String note;

    @NotNull(message = "warehouseId is required")
    private Long warehouseId;

    @NotEmpty(message = "items are required")
    @Valid
    private List<ReturnItemRequestDTO> items;

    @Data
    public static class ReturnItemRequestDTO {
        private Long goodsReceiptItemId; // CÃ³ thá»ƒ null

        @NotNull(message = "productId is required")
        private Long productId;

        @NotNull(message = "qty is required")
        @Positive(message = "qty must be greater than 0")
        private Integer qty;

        @NotNull(message = "returnAmount is required")
        @PositiveOrZero(message = "returnAmount must be >= 0")
        private BigDecimal returnAmount;
        private String note;
    }
}
