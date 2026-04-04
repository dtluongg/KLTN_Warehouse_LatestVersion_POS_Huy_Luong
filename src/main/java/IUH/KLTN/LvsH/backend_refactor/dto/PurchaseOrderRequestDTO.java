package IUH.KLTN.LvsH.backend_refactor.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class PurchaseOrderRequestDTO {
    private String poNo;
    private String supplierId;
    private String expectedDate;
    private String note;
    private Long warehouseId;
    
    private List<PoItemRequestDTO> items;

    @Data
    public static class PoItemRequestDTO {
        private Long productId;
        private Integer orderedQty;
        private BigDecimal expectedUnitCost;
    }
}
