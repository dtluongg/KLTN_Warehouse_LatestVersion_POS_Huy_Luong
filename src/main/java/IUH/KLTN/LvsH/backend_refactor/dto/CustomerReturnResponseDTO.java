package IUH.KLTN.LvsH.backend_refactor.dto;

import IUH.KLTN.LvsH.backend_refactor.enums.DocumentStatus;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CustomerReturnResponseDTO {
    private Long id;
    private String returnNo;
    private DocumentStatus status;
    private BigDecimal totalRefund;
}
