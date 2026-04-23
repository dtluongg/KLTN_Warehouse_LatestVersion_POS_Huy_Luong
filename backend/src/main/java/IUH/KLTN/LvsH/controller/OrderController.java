package IUH.KLTN.LvsH.controller;

import IUH.KLTN.LvsH.dto.CouponPreviewResponseDTO;
import IUH.KLTN.LvsH.dto.order.*;
import IUH.KLTN.LvsH.service.OrderService;
import IUH.KLTN.LvsH.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final PaymentService paymentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF')")
    public ResponseEntity<Page<OrderListResponseDTO>> getAllOrders(
            OrderSearchCriteria criteria,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(orderService.getAllOrders(criteria, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF')")
    public ResponseEntity<OrderDetailResponseDTO> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderDetailById(id));
    }

    @PostMapping("/{id}/change-payment-method")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF')")
    public ResponseEntity<OrderDetailResponseDTO> changePaymentMethod(@PathVariable Long id,
            @RequestParam IUH.KLTN.LvsH.enums.PaymentMethod paymentMethod) {
        return ResponseEntity.ok(orderService.changePaymentMethod(id, paymentMethod));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF')")
    public ResponseEntity<OrderDetailResponseDTO> cancelOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.cancelOrder(id));
    }

    @PostMapping("/{id}/reopen-qr")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF')")
    public ResponseEntity<?> reopenQr(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", paymentService.reopenPaymentLink(id)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()));
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF')")
    public ResponseEntity<OrderDetailResponseDTO> createOrder(@Valid @RequestBody OrderRequestDTO request) {
        return ResponseEntity.ok(orderService.createOrder(request));
    }

    @GetMapping("/{id}/payment-status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF')")
    public ResponseEntity<Map<String, Object>> getOrderPaymentStatus(@PathVariable Long id) {
        try {
            OrderDetailResponseDTO order = orderService.getOrderDetailById(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "orderStatus", order.getStatus(),
                    "netAmount", order.getNetAmount()));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
