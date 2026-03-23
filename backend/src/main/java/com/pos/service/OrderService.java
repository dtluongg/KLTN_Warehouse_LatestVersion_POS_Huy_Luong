package com.pos.service;

import com.pos.dto.OrderRequestDTO;
import com.pos.dto.OrderResponseDTO;
import com.pos.dto.OrderItemDetailDTO;
import com.pos.entity.Order;

import java.util.List;

public interface OrderService {
    List<Order> getAllOrders();
    Order getOrderById(Long id);
    List<OrderItemDetailDTO> getOrderItems(Long orderId);
    OrderResponseDTO createOrder(OrderRequestDTO req);
}
