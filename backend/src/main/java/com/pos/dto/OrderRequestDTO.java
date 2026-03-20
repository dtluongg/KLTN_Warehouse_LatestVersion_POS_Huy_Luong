package com.pos.dto;

import com.pos.enums.PaymentMethod;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class OrderRequestDTO {
    private UUID customerId;
    private Long warehouseId;
    private BigDecimal discountAmount;
    private String couponCode;
    private BigDecimal couponDiscountAmount;
    private BigDecimal surchargeAmount;
    private PaymentMethod paymentMethod;
    private String note;
    private List<OrderItemRequestDTO> items;
}
