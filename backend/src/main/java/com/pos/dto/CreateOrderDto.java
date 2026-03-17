package com.pos.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class CreateOrderDto {
    private String orderNo;
    private String salesChannel;
    private String customerId; // Sử dụng UUID dạng string
    private String discountCouponCode;
    private BigDecimal discountAmount;
    private BigDecimal surchargeAmount;
    private String paymentMethod;
    private String note;
    private Long createdByStaffId;

    private List<OrderItemDto> items;

    @Data
    public static class OrderItemDto {
        private Long productId;
        private Integer qty;
        private BigDecimal salePrice;
    }
}
