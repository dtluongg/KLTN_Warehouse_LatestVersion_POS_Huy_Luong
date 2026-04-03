package com.pos.service;

import com.pos.dto.CouponPreviewResponseDTO;
import com.pos.dto.OrderRequestDTO;
import com.pos.dto.OrderResponseDTO;
import com.pos.entity.Order;

import java.math.BigDecimal;
import java.util.List;

public interface OrderService {
    List<Order> getAllOrders();
    Order getOrderById(Long id);
    List<OrderResponseDTO.ItemResponseDTO> getOrderItems(Long orderId);
    CouponPreviewResponseDTO previewCoupon(String couponCode, BigDecimal grossAmount);
    OrderResponseDTO createOrder(OrderRequestDTO req);
}
