package IUH.KLTN.LvsH.dto.goods_receipt;

import IUH.KLTN.LvsH.enums.DocumentStatus;
import lombok.Data;
import java.time.LocalDate;

@Data
public class GoodsReceiptSearchCriteria {
    private String keyword; 
    private String supplierId;
    private Long warehouseId;
    private DocumentStatus status;
    private LocalDate startDate;
    private LocalDate endDate;
}
