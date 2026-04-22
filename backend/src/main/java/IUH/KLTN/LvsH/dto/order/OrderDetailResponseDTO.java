package IUH.KLTN.LvsH.dto.order;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class OrderDetailResponseDTO {
    private Long id;
    private String orderNo;
    private String salesChannel;
    
    // Customer Info
    private UUID customerId;
    private String customerName;
    private String customerPhone;
    
    // Warehouse Info
    private Long warehouseId;
    private String warehouseName;
    
    private LocalDateTime orderTime;
    private String status;
    private String paymentMethod;
    private String payosOrderCode;
    private String note;
    
    // Financials
    private BigDecimal grossAmount;
    private BigDecimal discountAmount;
    private String couponCode;
    private BigDecimal couponDiscountAmount;
    private BigDecimal surchargeAmount;
    private BigDecimal netAmount;
    
    private String createdBy;
    private LocalDateTime createdAt;

    private List<OrderItemResponseDTO> items;

    @Data
    @Builder
    public static class OrderItemResponseDTO {
        private Long id;
        private Long productId;
        private String productSku;
        private String productName;
        private Integer qty;
        private BigDecimal salePrice;
        private BigDecimal lineRevenue;
    }
}
