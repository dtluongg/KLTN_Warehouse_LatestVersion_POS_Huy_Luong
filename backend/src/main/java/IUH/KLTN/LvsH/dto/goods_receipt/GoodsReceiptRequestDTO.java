package IUH.KLTN.LvsH.dto.goods_receipt;

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
public class GoodsReceiptRequestDTO {
    private String grNo;

    @NotNull(message = "poId is required")
    private Long poId;

    @NotBlank(message = "supplierId is required")
    private String supplierId;

    @NotNull(message = "warehouseId is required")
    private Long warehouseId;

    private String note;

    @PositiveOrZero(message = "Chiết khấu không được âm")
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @PositiveOrZero(message = "Phụ phí không được âm")
    private BigDecimal surchargeAmount = BigDecimal.ZERO;

    @NotEmpty(message = "items are required")
    @Valid
    private List<GrItemRequestDTO> items;

    @Data
    public static class GrItemRequestDTO {
        @NotNull(message = "poItemId is required")
        private Long poItemId;

        @NotNull(message = "productId is required")
        private Long productId;

        @NotNull(message = "receivedQty is required")
        @Positive(message = "receivedQty must be greater than 0")
        private Integer receivedQty;

        @NotNull(message = "unitCost is required")
        @PositiveOrZero(message = "unitCost must be >= 0")
        private BigDecimal unitCost;
    }
}
