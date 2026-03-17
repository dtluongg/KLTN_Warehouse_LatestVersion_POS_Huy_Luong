package com.pos.service;

import com.pos.dto.CreateOrderDto;
import com.pos.entity.Order;

import java.util.List;

public interface OrderService {
    List<Order> getAllOrders();
    Order getOrderById(Long id);
    Order createOrder(CreateOrderDto dto);
    Order completeOrder(Long id);
}
