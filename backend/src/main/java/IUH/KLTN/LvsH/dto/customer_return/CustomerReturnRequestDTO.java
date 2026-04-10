package IUH.KLTN.LvsH.dto.customer_return;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class CustomerReturnRequestDTO {

    @NotNull(message = "Vui lòng chọn khách hàng")
    private String customerId;

    private Long orderId;

    @NotNull(message = "Vui lòng chọn kho hàng")
    private Long warehouseId;

    private String note;

    @PositiveOrZero(message = "Chiết khấu không được âm")
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @PositiveOrZero(message = "Phụ phí không được âm")
    private BigDecimal surchargeAmount = BigDecimal.ZERO;

    @NotEmpty(message = "Phiếu trả hàng phải có ít nhất 1 sản phẩm")
    @Valid
    private List<CustomerReturnItemRequestDTO> items;

    @Data
    public static class CustomerReturnItemRequestDTO {
        @NotNull(message = "Vui lòng chọn sản phẩm")
        private Long productId;

        private Long orderItemId;

        @NotNull(message = "Vui lòng nhập số lượng trả")
        private Integer qty;

        @NotNull(message = "Vui lòng nhập số tiền hoàn trả")
        private BigDecimal refundAmount;
    }
}
