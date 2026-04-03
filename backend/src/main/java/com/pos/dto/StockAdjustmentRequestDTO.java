package com.pos.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class StockAdjustmentRequestDTO {
    private String adjustNo;
    private Long warehouseId;
    private String reason;
    private String note;
    private Long createdByStaffId;


    private List<AdjustmentItemRequestDTO> items;

    @Data
    public static class AdjustmentItemRequestDTO {
        private Long productId;
        private Integer actualQty; // Số lượng thực tế kiểm đếm được
    }
}
