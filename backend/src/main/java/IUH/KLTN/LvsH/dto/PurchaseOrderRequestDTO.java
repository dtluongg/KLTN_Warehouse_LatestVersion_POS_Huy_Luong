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
public class PurchaseOrderRequestDTO {
    private String poNo;

    @NotBlank(message = "supplierId is required")
    private String supplierId;

    private String expectedDate;
    private String note;

    @NotNull(message = "warehouseId is required")
    private Long warehouseId;
    
    @NotEmpty(message = "items are required")
    @Valid
    private List<PoItemRequestDTO> items;

    @Data
    public static class PoItemRequestDTO {
        @NotNull(message = "productId is required")
        private Long productId;

        @NotNull(message = "orderedQty is required")
        @Positive(message = "orderedQty must be greater than 0")
        private Integer orderedQty;

        @NotNull(message = "expectedUnitCost is required")
        @PositiveOrZero(message = "expectedUnitCost must be >= 0")
        private BigDecimal expectedUnitCost;
    }
}
