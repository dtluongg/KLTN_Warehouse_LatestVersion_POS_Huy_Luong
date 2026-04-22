package IUH.KLTN.LvsH.controller;

import IUH.KLTN.LvsH.dto.payment.CreatePaymentLinkResponseDTO;
import IUH.KLTN.LvsH.service.PaymentService;
import com.fasterxml.jackson.core.JsonProcessingException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * Tạo payment link QR cho đơn hàng
     */
    @PostMapping("/create-qr/{orderId}")
    public ResponseEntity<Map<String, Object>> createPaymentLink(@PathVariable Long orderId) {
        try {
            CreatePaymentLinkResponseDTO response = paymentService.createPaymentLink(orderId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Payment link created successfully",
                    "data", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()));
        }
    }

    @GetMapping("/check/{orderId}")
    public ResponseEntity<?> checkPayment(@PathVariable Long orderId) {
        return ResponseEntity.ok(paymentService.checkPaymentStatus(orderId));
    }

    /**
     * Webhook handler - nhận callback từ PayOS khi thanh toán thành công
     */
    @PostMapping("/webhook")
    public ResponseEntity<Map<String, Object>> handlePaymentWebhook(@RequestBody Object body)
            throws JsonProcessingException {
        try {
            Map<String, Object> result = paymentService.verifyWebhook(body);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Webhook verification failed: " + e.getMessage()));
        }
    }
}
