package IUH.KLTN.LvsH.dto.order;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class OrderSearchCriteria {
    private String keyword; // orderNo, customerName
    private String customerId; // UUID string
    private String status;
    private String salesChannel;
    private String paymentMethod;
    private Long warehouseId;
    private LocalDateTime fromDate;
    private LocalDateTime toDate;
}
