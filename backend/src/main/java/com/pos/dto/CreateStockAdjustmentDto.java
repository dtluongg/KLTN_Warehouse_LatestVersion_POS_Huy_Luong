package com.pos.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class CreateStockAdjustmentDto {
    private String adjustNo;
    private Long warehouseId;
    private String reason;
    private String note;
    private Long createdByStaffId;


    private List<AdjustmentItemDto> items;

    @Data
    public static class AdjustmentItemDto {
        private Long productId;
        private Integer actualQty; // Số lượng thực tế kiểm đếm được
    }
}
