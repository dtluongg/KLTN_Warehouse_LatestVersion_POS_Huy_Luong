package IUH.KLTN.LvsH.dto.purchase_order;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class PurchaseOrderListResponseDTO {
    private Long id;
    private String poNo;
    private String supplierName;
    private String warehouseName;
    private LocalDate orderDate;
    private LocalDate expectedDate;
    private String status;
    private String receiptProgress;
    private BigDecimal totalAmountPayable;
    private String createdBy;
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime closedAt;
    private String closedReason;
    private Boolean allowOverReceipt;
    private String note;
}
