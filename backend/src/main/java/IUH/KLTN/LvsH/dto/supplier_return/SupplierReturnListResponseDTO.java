package IUH.KLTN.LvsH.dto.supplier_return;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class SupplierReturnListResponseDTO {
    private Long id;
    private String returnNo;
    private String supplierName;
    private Long goodsReceiptId;
    private String warehouseName;
    private LocalDate returnDate;
    private String status;
    private BigDecimal totalAmountPayable;
    private String createdBy;
    private java.time.LocalDateTime createdAt;
    private String note;
}
