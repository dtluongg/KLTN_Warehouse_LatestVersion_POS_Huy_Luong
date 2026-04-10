package IUH.KLTN.LvsH.dto.purchase_order;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

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
    private BigDecimal totalAmountPayable;
    private String createdBy;
    private java.time.LocalDateTime createdAt;
    private String note;
}
