package IUH.KLTN.LvsH.dto.goods_receipt;

import IUH.KLTN.LvsH.enums.DocumentStatus;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class GoodsReceiptDetailResponseDTO {
    private Long id;
    private String grNo;
    private Long poId;
    private String poNo;
    private String supplierId;
    private String supplierName;
    private Long warehouseId;
    private String warehouseName;
    private String createdById;
    private String createdByName;
    private LocalDate receiptDate;
    private DocumentStatus status;
    private String note;
    private BigDecimal totalAmount;
    private BigDecimal totalVat;
    private BigDecimal discountAmount;
    private BigDecimal surchargeAmount;
    private BigDecimal totalAmountPayable;
    private LocalDateTime createdAt;
    
    private List<GrItemResponseDTO> items;

    @Data
    @Builder
    public static class GrItemResponseDTO {
        private Long id;
        private Long productId;
        private String productSku;
        private String productName;
        private Integer receivedQty;
        private BigDecimal unitCost;
        private BigDecimal vatRate;
        private BigDecimal lineTotal;
    }
}
