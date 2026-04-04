package IUH.KLTN.LvsH.backend_refactor.service;

import IUH.KLTN.LvsH.backend_refactor.dto.CouponPreviewResponseDTO;
import IUH.KLTN.LvsH.backend_refactor.dto.OrderRequestDTO;
import IUH.KLTN.LvsH.backend_refactor.dto.OrderResponseDTO;
import IUH.KLTN.LvsH.backend_refactor.entity.Order;

import java.math.BigDecimal;
import java.util.List;

public interface OrderService {
    List<Order> getAllOrders();
    Order getOrderById(Long id);
    List<OrderResponseDTO.ItemResponseDTO> getOrderItems(Long orderId);
    CouponPreviewResponseDTO previewCoupon(String couponCode, BigDecimal grossAmount);
    OrderResponseDTO createOrder(OrderRequestDTO req);
}
