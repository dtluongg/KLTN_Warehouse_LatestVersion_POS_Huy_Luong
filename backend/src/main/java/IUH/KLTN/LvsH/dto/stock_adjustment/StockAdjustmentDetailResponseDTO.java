package IUH.KLTN.LvsH.dto.stock_adjustment;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class StockAdjustmentDetailResponseDTO {
    private Long id;
    private String adjustNo;
    private Long warehouseId;
    private String warehouseName;
    private LocalDate adjustDate;
    private String status;
    private String reason;
    private String note;
    private String createdBy;
    private LocalDateTime createdAt;
    
    private List<StockAdjustmentItemResponseDTO> items;

    @Data
    @Builder
    public static class StockAdjustmentItemResponseDTO {
        private Long id;
        private Long productId;
        private String productSku;
        private String productName;
        private Integer adjustQty;
    }
}
