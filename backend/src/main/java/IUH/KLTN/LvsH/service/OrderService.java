package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.dto.CouponPreviewResponseDTO;
import IUH.KLTN.LvsH.dto.order.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.math.BigDecimal;

public interface OrderService {
    Page<OrderListResponseDTO> getAllOrders(OrderSearchCriteria criteria, Pageable pageable);
    OrderDetailResponseDTO getOrderDetailById(Long id);
    OrderDetailResponseDTO createOrder(OrderRequestDTO request);
    CouponPreviewResponseDTO previewCoupon(String couponCode, BigDecimal grossAmount);

    OrderDetailResponseDTO changePaymentMethod(Long orderId, IUH.KLTN.LvsH.enums.PaymentMethod paymentMethod);
    OrderDetailResponseDTO cancelOrder(Long orderId);
    Object reopenQr(Long orderId);
}
