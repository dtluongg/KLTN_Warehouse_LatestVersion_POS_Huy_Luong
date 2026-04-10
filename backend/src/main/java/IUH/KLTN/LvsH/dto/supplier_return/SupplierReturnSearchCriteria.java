package IUH.KLTN.LvsH.dto.supplier_return;

import lombok.Data;
import java.time.LocalDate;

@Data
public class SupplierReturnSearchCriteria {
    private String keyword; // returnNo, supplierName
    private Long warehouseId;
    private String status;
    private LocalDate fromDate;
    private LocalDate toDate;
}
