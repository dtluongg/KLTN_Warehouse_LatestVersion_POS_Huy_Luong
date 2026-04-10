package IUH.KLTN.LvsH.dto.goods_receipt;

import IUH.KLTN.LvsH.enums.DocumentStatus;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class GoodsReceiptListResponseDTO {
    private Long id;
    private String grNo;
    private String poNo;
    private String supplierName;
    private String warehouseName;
    private String createdByName;
    private LocalDate receiptDate;
    private DocumentStatus status;
    private BigDecimal totalAmountPayable;
    private java.time.LocalDateTime createdAt;
    private String note;
}
