package com.pos.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemDetailDTO {
    private Long id;
    private Integer qty;
    private BigDecimal salePrice;
    private BigDecimal lineRevenue;
    private ProductLiteDTO product;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductLiteDTO {
        private Long id;
        private String sku;
        private String name;
    }
}