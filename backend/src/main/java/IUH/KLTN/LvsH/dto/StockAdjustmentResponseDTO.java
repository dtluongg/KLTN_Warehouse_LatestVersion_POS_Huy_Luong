package IUH.KLTN.LvsH.dto;

import IUH.KLTN.LvsH.enums.DocumentStatus;
import lombok.Data;

@Data
public class StockAdjustmentResponseDTO {
    private Long id;
    private String adjustNo;
    private DocumentStatus status;
}
