package com.pos.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class CreatePurchaseOrderDto {
    private String poNo;
    private String supplierId;
    private String expectedDate;
    private String note;
    private Long createdByStaffId;
    
    private Long warehouseId;
    
    private List<PoItemDto> items;

    @Data
    public static class PoItemDto {
        private Long productId;
        private Integer orderedQty;
        private BigDecimal expectedUnitCost;
    }
}
