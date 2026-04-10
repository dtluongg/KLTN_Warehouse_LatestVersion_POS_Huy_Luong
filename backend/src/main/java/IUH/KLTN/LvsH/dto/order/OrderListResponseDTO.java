package IUH.KLTN.LvsH.dto.order;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class OrderListResponseDTO {
    private Long id;
    private String orderNo;
    private String salesChannel;
    private String customerName;
    private String warehouseName;
    private LocalDateTime orderTime;
    private String status;
    private BigDecimal netAmount;
    private String paymentMethod;
    private String createdBy;
    private String note;
    private BigDecimal grossAmount;
    private BigDecimal discountAmount;
    private BigDecimal couponDiscountAmount;
    private BigDecimal surchargeAmount;
}
