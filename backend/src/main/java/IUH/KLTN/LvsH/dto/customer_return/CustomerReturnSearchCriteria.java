package IUH.KLTN.LvsH.dto.customer_return;

import lombok.Data;
import java.time.LocalDate;

@Data
public class CustomerReturnSearchCriteria {
    private String keyword; // returnNo, customerName
    private Long orderId;
    private Long warehouseId;
    private String status;
    private LocalDate fromDate;
    private LocalDate toDate;
}
