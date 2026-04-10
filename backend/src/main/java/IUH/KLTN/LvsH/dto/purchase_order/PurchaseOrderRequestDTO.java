package IUH.KLTN.LvsH.dto.purchase_order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class PurchaseOrderRequestDTO {
    
    @NotNull(message = "Vui lòng chọn nhà cung cấp")
    private UUID supplierId;

    @NotNull(message = "Vui lòng chọn kho hàng")
    private Long warehouseId;

    private LocalDate expectedDate;

    private String note;

    @PositiveOrZero(message = "Chiết khấu không được âm")
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @PositiveOrZero(message = "Phụ phí không được âm")
    private BigDecimal surchargeAmount = BigDecimal.ZERO;

    @NotEmpty(message = "Đơn nhập hàng chờ phải có ít nhất 1 sản phẩm")
    @Valid
    private List<PurchaseOrderItemRequestDTO> items;

    @Data
    public static class PurchaseOrderItemRequestDTO {
        @NotNull(message = "Vui lòng chọn sản phẩm")
        private Long productId;

        @NotNull(message = "Vui lòng nhập số lượng đặt")
        @Positive(message = "Số lượng phải lớn hơn 0")
        private Integer orderedQty;

        @NotNull(message = "Vui lòng nhập giá dự kiến")
        @PositiveOrZero(message = "Giá dự kiến không được âm")
        private BigDecimal expectedUnitCost;
    }
}
