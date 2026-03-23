package com.pos.dto;

import com.pos.enums.DocumentStatus;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PurchaseOrderResponseDTO {
    private Long id;
    private String poNo;
    private DocumentStatus status;
    private BigDecimal totalAmount;
    private BigDecimal totalVat;
    private BigDecimal totalAmountPayable;
}
