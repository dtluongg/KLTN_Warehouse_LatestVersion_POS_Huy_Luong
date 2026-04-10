package IUH.KLTN.LvsH.dto.supplier_return;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class SupplierReturnRequestDTO {
    
    @NotNull(message = "Vui lòng chọn nhà cung cấp")
    private String supplierId;

    private Long goodsReceiptId;

    @NotNull(message = "Vui lòng chọn kho hàng")
    private Long warehouseId;

    private String note;

    @jakarta.validation.constraints.PositiveOrZero(message = "Chiết khấu không được âm")
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @jakarta.validation.constraints.PositiveOrZero(message = "Phụ phí không được âm")
    private BigDecimal surchargeAmount = BigDecimal.ZERO;

    @NotEmpty(message = "Phiếu trả hàng phải có ít nhất 1 sản phẩm")
    @Valid
    private List<SupplierReturnItemRequestDTO> items;

    @Data
    public static class SupplierReturnItemRequestDTO {
        @NotNull(message = "Vui lòng chọn sản phẩm")
        private Long productId;

        private Long goodsReceiptItemId;

        @NotNull(message = "Vui lòng nhập số lượng trả")
        private Integer qty;

        @NotNull(message = "Vui lòng nhập số tiền hoàn trả")
        private BigDecimal returnAmount;

        private String note;
    }
}
