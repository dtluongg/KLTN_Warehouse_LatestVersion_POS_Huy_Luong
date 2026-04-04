package IUH.KLTN.LvsH.backend_refactor.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class SupplierReturnRequestDTO {
    private Long goodsReceiptId; // Phiáº¿u nháº­p gá»‘c (cÃ³ thá»ƒ null náº¿u tráº£ tá»± do)
    private String supplierId;   // UUID
    private String note;
    private Long warehouseId;

    private List<ReturnItemRequestDTO> items;

    @Data
    public static class ReturnItemRequestDTO {
        private Long goodsReceiptItemId; // CÃ³ thá»ƒ null
        private Long productId;
        private Integer qty;
        private BigDecimal returnAmount;
        private String note;
    }
}
