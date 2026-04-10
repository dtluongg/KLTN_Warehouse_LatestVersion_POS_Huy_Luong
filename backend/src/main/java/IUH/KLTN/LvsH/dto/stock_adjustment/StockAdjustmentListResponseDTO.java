package IUH.KLTN.LvsH.dto.stock_adjustment;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class StockAdjustmentListResponseDTO {
    private Long id;
    private String adjustNo;
    private String warehouseName;
    private LocalDate adjustDate;
    private String status;
    private String reason;
    private String note;
    private String createdBy;
    private java.time.LocalDateTime createdAt;
}
