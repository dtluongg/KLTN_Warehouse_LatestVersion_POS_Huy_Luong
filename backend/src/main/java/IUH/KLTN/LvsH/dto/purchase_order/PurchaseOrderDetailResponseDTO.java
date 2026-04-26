package IUH.KLTN.LvsH.dto.purchase_order;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class PurchaseOrderDetailResponseDTO {
    private Long id;
    private String poNo;
    
    private UUID supplierId;
    private String supplierName;
    
    private Long warehouseId;
    private String warehouseName;
    
    private LocalDate orderDate;
    private LocalDate expectedDate;
    private String status;
    private String receiptProgress;
    private LocalDateTime closedAt;
    private String closedReason;
    private Boolean allowOverReceipt;
    private String note;
    
    private BigDecimal totalAmount;
    private BigDecimal totalVat;
    private BigDecimal discountAmount;
    private BigDecimal surchargeAmount;
    private BigDecimal totalAmountPayable;
    
    private String createdBy;
    private LocalDateTime createdAt;

    private List<PurchaseOrderItemResponseDTO> items;

    // Danh sách cảnh báo biến động giá (nếu có)
    private List<String> warnings;

    @Data
    @Builder
    public static class PurchaseOrderItemResponseDTO {
        private Long id;
        private Long productId;
        private String productSku;
        private String productName;
        private Integer orderedQty;
        private Integer receivedQty;
        private Integer remainingQty;
        private BigDecimal expectedUnitCost;
        private BigDecimal standardPrice; // Giá tham chiếu từ bảng giá NCC
        private BigDecimal vatRate;
        private BigDecimal lineTotal;
    }
}
