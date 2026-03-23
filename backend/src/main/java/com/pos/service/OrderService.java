package com.pos.service;

import com.pos.dto.OrderRequestDTO;
import com.pos.dto.OrderResponseDTO;
import com.pos.entity.Order;

import java.util.List;

public interface OrderService {
    List<Order> getAllOrders();
    Order getOrderById(Long id);
    OrderResponseDTO createOrder(OrderRequestDTO req);
}
