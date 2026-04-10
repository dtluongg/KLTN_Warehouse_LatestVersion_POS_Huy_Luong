package IUH.KLTN.LvsH.dto.customer_return;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class CustomerReturnDetailResponseDTO {
    private Long id;
    private String returnNo;
    private String customerId;
    private String customerName;
    private Long orderId;
    private String orderNo;
    private Long warehouseId;
    private String warehouseName;
    private LocalDate returnDate;
    private String status;
    private String note;
    
    private BigDecimal totalRefund;
    private BigDecimal discountAmount;
    private BigDecimal surchargeAmount;
    private String createdBy;
    private LocalDateTime createdAt;
    
    private List<CustomerReturnItemResponseDTO> items;

    @Data
    @Builder
    public static class CustomerReturnItemResponseDTO {
        private Long id;
        private Long productId;
        private String productSku;
        private String productName;
        private Long orderItemId;
        private Integer qty;
        private BigDecimal refundAmount;
    }
}
