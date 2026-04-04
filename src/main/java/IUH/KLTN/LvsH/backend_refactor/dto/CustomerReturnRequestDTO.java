package IUH.KLTN.LvsH.backend_refactor.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class CustomerReturnRequestDTO {
    private String returnNo;
    private String customerId; // UUID
    private Long orderId; // CÃ³ thá»ƒ null náº¿u khÃ¡ch tráº£ tá»± do
    private String note;
    private Long warehouseId;

    private List<ReturnItemRequestDTO> items;

    @Data
    public static class ReturnItemRequestDTO {
        private Long orderItemId; // CÃ³ thá»ƒ null 
        private Long productId;
        private Integer qty;
        private BigDecimal refundAmount;
    }
}
