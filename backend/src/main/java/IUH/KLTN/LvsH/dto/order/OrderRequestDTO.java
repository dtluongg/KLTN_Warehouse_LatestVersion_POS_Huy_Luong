package IUH.KLTN.LvsH.dto.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class OrderRequestDTO {
    
    private UUID customerId;

    @NotNull(message = "Vui lòng chọn kho hàng")
    private Long warehouseId;

    @NotNull(message = "Vui lòng chọn kênh bán hàng")
    private String salesChannel;

    @NotNull(message = "Vui lòng chọn phương thức thanh toán")
    private String paymentMethod;

    private String note;
    
    private String couponCode;

    private BigDecimal discountAmount;

    private BigDecimal surchargeAmount;

    @NotEmpty(message = "Đơn hàng phải có ít nhất 1 sản phẩm")
    @Valid
    private List<OrderItemRequestDTO> items;

    @Data
    public static class OrderItemRequestDTO {
        @NotNull(message = "Vui lòng chọn sản phẩm")
        private Long productId;

        @NotNull(message = "Vui lòng nhập số lượng")
        @Positive(message = "Số lượng phải lớn hơn 0")
        private Integer qty;

        @NotNull(message = "Vui lòng nhập giá bán")
        @Positive(message = "Giá bán phải lớn hơn 0")
        private BigDecimal salePrice;
    }
}
