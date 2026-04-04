package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.dto.CouponPreviewResponseDTO;
import IUH.KLTN.LvsH.dto.OrderRequestDTO;
import IUH.KLTN.LvsH.dto.OrderResponseDTO;
import IUH.KLTN.LvsH.entity.Order;

import java.math.BigDecimal;
import java.util.List;

public interface OrderService {
    List<Order> getAllOrders();
    Order getOrderById(Long id);
    List<OrderResponseDTO.ItemResponseDTO> getOrderItems(Long orderId);
    CouponPreviewResponseDTO previewCoupon(String couponCode, BigDecimal grossAmount);
    OrderResponseDTO createOrder(OrderRequestDTO req);
}
