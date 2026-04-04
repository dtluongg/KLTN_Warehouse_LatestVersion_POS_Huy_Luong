package IUH.KLTN.LvsH.backend_refactor.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class GoodsReceiptRequestDTO {
    private String grNo;
    private Long poId;
    private String supplierId;
    private Long warehouseId;
    private String note;
    private List<GrItemRequestDTO> items;

    @Data
    public static class GrItemRequestDTO {
        private Long poItemId;
        private Long productId;
        private Integer receivedQty;
        private BigDecimal unitCost;
    }
}
