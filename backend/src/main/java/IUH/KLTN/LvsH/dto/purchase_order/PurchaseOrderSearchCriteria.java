package IUH.KLTN.LvsH.dto.purchase_order;

import lombok.Data;
import java.time.LocalDate;

@Data
public class PurchaseOrderSearchCriteria {
    private String keyword; // poNo, supplierName
    private Long warehouseId;
    private String status;
    private LocalDate fromDate;
    private LocalDate toDate;
}
