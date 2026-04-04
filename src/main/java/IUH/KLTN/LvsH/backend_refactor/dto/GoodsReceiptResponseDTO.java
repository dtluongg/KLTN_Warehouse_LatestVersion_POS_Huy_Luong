package IUH.KLTN.LvsH.backend_refactor.dto;

import IUH.KLTN.LvsH.backend_refactor.enums.DocumentStatus;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class GoodsReceiptResponseDTO {
    private Long id;
    private String grNo;
    private DocumentStatus status;
    private BigDecimal totalAmount;
    private BigDecimal totalVat;
    private BigDecimal totalAmountPayable;
}
