package IUH.KLTN.LvsH.dto.supplier_return;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class SupplierReturnDetailResponseDTO {
    private Long id;
    private String returnNo;
    private String supplierId;
    private String supplierName;
    private Long goodsReceiptId;
    private String goodsReceiptNo;
    private Long warehouseId;
    private String warehouseName;
    private LocalDate returnDate;
    private String status;
    private String note;
    
    private BigDecimal totalAmount;
    private BigDecimal totalVat;
    private BigDecimal discountAmount;
    private BigDecimal surchargeAmount;
    private BigDecimal totalAmountPayable;
    private String createdBy;
    private LocalDateTime createdAt;
    
    private List<SupplierReturnItemResponseDTO> items;

    @Data
    @Builder
    public static class SupplierReturnItemResponseDTO {
        private Long id;
        private Long productId;
        private String productSku;
        private String productName;
        private Long goodsReceiptItemId;
        private Integer qty;
        private BigDecimal returnAmount;
        private String note;
    }
}
