package IUH.KLTN.LvsH.dto.customer_return;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class CustomerReturnListResponseDTO {
    private Long id;
    private String returnNo;
    private String customerName;
    private Long orderId;
    private String orderNo;
    private String warehouseName;
    private LocalDate returnDate;
    private String status;
    private BigDecimal totalRefund;
    private String createdBy;
    private java.time.LocalDateTime createdAt;
    private String note;
}
