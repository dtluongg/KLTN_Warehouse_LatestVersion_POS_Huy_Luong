package IUH.KLTN.LvsH.backend_refactor.dto;

import IUH.KLTN.LvsH.backend_refactor.enums.DocumentStatus;
import lombok.Data;

@Data
public class StockAdjustmentResponseDTO {
    private Long id;
    private String adjustNo;
    private DocumentStatus status;
}
