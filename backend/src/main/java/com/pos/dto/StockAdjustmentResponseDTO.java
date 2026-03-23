package com.pos.dto;

import com.pos.enums.DocumentStatus;
import lombok.Data;

@Data
public class StockAdjustmentResponseDTO {
    private Long id;
    private String adjustNo;
    private DocumentStatus status;
}
