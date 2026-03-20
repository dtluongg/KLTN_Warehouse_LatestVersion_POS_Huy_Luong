package com.pos.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class CreateCustomerReturnDto {
    private String returnNo;
    private String customerId; // UUID
    private Long orderId; // Có thể null nếu khách trả tự do
    private String note;
    private Long createdByStaffId;

    private Long warehouseId;
    private BigDecimal totalRefund;

    private List<ReturnItemDto> items;

    @Data
    public static class ReturnItemDto {
        private Long orderItemId; // Có thể null 
        private Long productId;
        private Integer qty;
        private BigDecimal refundAmount;
    }
}
