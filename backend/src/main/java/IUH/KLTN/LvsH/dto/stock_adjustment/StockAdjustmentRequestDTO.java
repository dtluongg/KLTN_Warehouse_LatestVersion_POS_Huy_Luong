package IUH.KLTN.LvsH.dto.stock_adjustment;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class StockAdjustmentRequestDTO {
    
    @NotNull(message = "Vui lòng chọn kho hàng")
    private Long warehouseId;

    @NotNull(message = "Vui lòng nhập ngày kiểm kê")
    private LocalDate adjustDate;

    private String reason;
    private String note;

    @NotEmpty(message = "Phiếu kiểm kho phải có ít nhất 1 sản phẩm")
    @Valid
    private List<StockAdjustmentItemRequestDTO> items;

    @Data
    public static class StockAdjustmentItemRequestDTO {
        @NotNull(message = "Vui lòng chọn sản phẩm")
        private Long productId;

        @NotNull(message = "Vui lòng nhập số lượng chênh lệch (âm hoặc dương)")
        private Integer adjustQty; // positive: add, negative: subtract
    }
}
