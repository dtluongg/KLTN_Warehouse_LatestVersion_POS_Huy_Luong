package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.dto.payment.CreatePaymentLinkResponseDTO;
import IUH.KLTN.LvsH.entity.Order;
import IUH.KLTN.LvsH.repository.OrderRepository;
import IUH.KLTN.LvsH.enums.DocumentStatus;
import IUH.KLTN.LvsH.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.webhooks.WebhookData;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PayOS payOS;
    private final OrderRepository orderRepository;

    @Override
    @Transactional
    public CreatePaymentLinkResponseDTO createPaymentLink(Long orderId) {
        // Lấy order từ database
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        // Kiểm tra nếu đã có payosOrderCode rồi thì không tạo lại
        if (order.getPayosOrderCode() != null && !order.getPayosOrderCode().isEmpty()) {
            throw new RuntimeException("Payment link already created for this order");
        }

        // Tạo orderCode từ order ID (timestamp based để đảm bảo unique)
        long orderCode = orderId + System.currentTimeMillis() / 1000;
        String netAmount = order.getNetAmount().toPlainString();
        String payosDescription = buildPayosDescription(order.getOrderNo());

        try {
            // Tạo payment link request
            CreatePaymentLinkRequest paymentRequest = CreatePaymentLinkRequest.builder()
                    .orderCode(orderCode)
                    .amount(order.getNetAmount().longValue())
                    .description(payosDescription)
                    .returnUrl("http://localhost:3000/success") // TODO: Thay đổi theo URL frontend của bạn
                    .cancelUrl("http://localhost:3000/cancel") // TODO: Thay đổi theo URL frontend của bạn
                    .build();

            // Gọi PayOS API để tạo payment link
            CreatePaymentLinkResponse paymentResponse = payOS.paymentRequests().create(paymentRequest);

            // Cập nhật order với payos order code
            order.setPayosOrderCode(String.valueOf(orderCode));
            // Đơn hàng giữ trạng thái DRAFT khi đang chờ thanh toán
            orderRepository.save(order);

            // Map response thành DTO
            CreatePaymentLinkResponseDTO responseDTO = new CreatePaymentLinkResponseDTO();
            responseDTO.setOrderCode(String.valueOf(orderCode));
            responseDTO.setAmount(netAmount);
            responseDTO.setDescription(paymentResponse.getDescription());
            responseDTO.setCheckoutUrl(paymentResponse.getCheckoutUrl());
            responseDTO.setQrCode(paymentResponse.getQrCode());
            responseDTO.setStatus(String.valueOf(paymentResponse.getStatus()));

            return responseDTO;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create payment link: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public Map<String, Object> verifyWebhook(Object body) {
        Map<String, Object> result = new HashMap<>();
        try {
            // Verify webhook signature với PayOS
            WebhookData webhookData = payOS.webhooks().verify(body);

            // Extract thông tin từ webhook
            Long orderCode = webhookData.getOrderCode();
            Long amountReceived = webhookData.getAmount();

            // Tìm order theo payosOrderCode
            Order order = orderRepository.findByPayosOrderCode(String.valueOf(orderCode))
                    .orElseThrow(() -> new RuntimeException("Order not found for payos order code: " + orderCode));

            // Verify số tiền khớp
            BigDecimal expectedAmount = order.getNetAmount();
            if (expectedAmount.longValue() != amountReceived) {
                throw new RuntimeException(
                        String.format("Amount mismatch: expected %d, received %d",
                                expectedAmount.longValue(), amountReceived));
            }

            // Cập nhật trạng thái thanh toán
            order.setStatus(DocumentStatus.POSTED); // Đơn hàng đã thanh toán thành công
            orderRepository.save(order);

            result.put("success", true);
            result.put("message", "Payment verified successfully");
            result.put("orderCode", orderCode);
            result.put("amount", amountReceived);

            return result;

        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Webhook verification failed: " + e.getMessage());
            return result;
        }
    }

    private String buildPayosDescription(String orderNo) {
        String base = "DH " + (orderNo == null ? "N/A" : orderNo.trim());
        if (base.length() <= 25) {
            return base;
        }
        return base.substring(0, 25);
    }

    @Override
    @Transactional
    public Map<String, Object> checkPaymentStatus(Long orderId) {
        Map<String, Object> result = new HashMap<>();

        try {
            // 1. Lấy order
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            if (order.getPayosOrderCode() == null) {
                throw new RuntimeException("Order chưa có PayOS orderCode");
            }

            // 2. Gọi PayOS API (CHỖ QUAN TRỌNG NHẤT)
            var paymentData = payOS.paymentRequests()
                    .get(Long.parseLong(order.getPayosOrderCode()));

            String status = paymentData.getStatus().toString(); // PENDING | PAID | CANCELLED

            // 3. Update DB theo status
            if ("PAID".equals(status)) {
                order.setStatus(DocumentStatus.POSTED);
            } else if ("CANCELLED".equals(status)) {
                order.setStatus(DocumentStatus.CANCELLED);
            }

            orderRepository.save(order);

            result.put("success", true);
            result.put("payosStatus", status);
            result.put("orderStatus", order.getStatus());

            return result;

        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage());
            return result;
        }
    }
}
