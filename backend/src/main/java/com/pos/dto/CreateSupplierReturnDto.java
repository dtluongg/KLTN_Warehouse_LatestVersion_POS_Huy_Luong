package com.pos.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class CreateSupplierReturnDto {
    private Long goodsReceiptId; // Phiếu nhập gốc (có thể null nếu trả tự do)
    private String supplierId;   // UUID
    private String note;
    private Long createdByStaffId;

    private Long warehouseId;

    private List<ReturnItemDto> items;

    @Data
    public static class ReturnItemDto {
        private Long goodsReceiptItemId; // Có thể null
        private Long productId;
        private Integer qty;
        private BigDecimal returnAmount;
        private String note;
    }
}
