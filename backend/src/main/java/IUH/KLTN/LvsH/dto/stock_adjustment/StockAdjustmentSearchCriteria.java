package IUH.KLTN.LvsH.dto.stock_adjustment;

import lombok.Data;
import java.time.LocalDate;

@Data
public class StockAdjustmentSearchCriteria {
    private String keyword; // adjustNo
    private Long warehouseId;
    private String status;
    private LocalDate fromDate;
    private LocalDate toDate;
}
