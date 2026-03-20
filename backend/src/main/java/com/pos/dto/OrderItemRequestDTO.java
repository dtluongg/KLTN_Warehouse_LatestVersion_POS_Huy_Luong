package com.pos.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class OrderItemRequestDTO {
    private Long productId;
    private Integer quantity;
    private BigDecimal salePrice;
}
