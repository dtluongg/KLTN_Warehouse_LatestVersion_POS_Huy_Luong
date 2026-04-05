package IUH.KLTN.LvsH.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;
import java.util.List;

@Data
public class StockAdjustmentRequestDTO {
    private String adjustNo;

    @NotNull(message = "warehouseId is required")
    private Long warehouseId;

    @NotBlank(message = "reason is required")
    private String reason;

    private String note;

    @NotEmpty(message = "items are required")
    @Valid
    private List<AdjustmentItemRequestDTO> items;

    @Data
    public static class AdjustmentItemRequestDTO {
        @NotNull(message = "productId is required")
        private Long productId;

        @NotNull(message = "actualQty is required")
        @PositiveOrZero(message = "actualQty must be >= 0")
        private Integer actualQty; // Sá»‘ lÆ°á»£ng thá»±c táº¿ kiá»ƒm Ä‘áº¿m Ä‘Æ°á»£c
    }
}
