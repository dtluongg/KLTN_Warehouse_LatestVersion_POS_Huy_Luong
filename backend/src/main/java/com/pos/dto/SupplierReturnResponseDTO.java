package com.pos.dto;

import com.pos.enums.DocumentStatus;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class SupplierReturnResponseDTO {
    private Long id;
    private String returnNo;
    private DocumentStatus status;
    private BigDecimal totalAmount;
    private BigDecimal totalVat;
    private BigDecimal totalAmountPayable;
}
