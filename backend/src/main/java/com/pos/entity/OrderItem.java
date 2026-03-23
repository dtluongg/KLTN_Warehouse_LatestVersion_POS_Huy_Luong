package com.pos.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer qty;

    @Column(name = "sale_price", nullable = false)
    private BigDecimal salePrice;

    @Column(name = "cost_at_sale", nullable = false)
    private BigDecimal costAtSale;

    @Column(name = "line_revenue", nullable = false)
    private BigDecimal lineRevenue;

    @Column(name = "line_cogs", nullable = false)
    private BigDecimal lineCogs;

    @Column(name = "line_profit", nullable = false)
    private BigDecimal lineProfit;
}
