package IUH.KLTN.LvsH.backend_refactor.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class StockAdjustmentRequestDTO {
    private String adjustNo;
    private Long warehouseId;
    private String reason;
    private String note;
    private List<AdjustmentItemRequestDTO> items;

    @Data
    public static class AdjustmentItemRequestDTO {
        private Long productId;
        private Integer actualQty; // Sá»‘ lÆ°á»£ng thá»±c táº¿ kiá»ƒm Ä‘áº¿m Ä‘Æ°á»£c
    }
}
