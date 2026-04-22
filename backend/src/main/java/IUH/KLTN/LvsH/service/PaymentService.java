package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.dto.payment.CreatePaymentLinkResponseDTO;
import java.util.Map;

public interface PaymentService {
    /**
     * Tạo payment link QR cho đơn hàng
     */
    CreatePaymentLinkResponseDTO createPaymentLink(Long orderId);

    /**
     * Xác minh webhook từ PayOS
     */
    Map<String, Object> verifyWebhook(Object body);

    /**
     * Check trạng thái thanh toán từ PayOS
     */
    Map<String, Object> checkPaymentStatus(Long orderId);

}
