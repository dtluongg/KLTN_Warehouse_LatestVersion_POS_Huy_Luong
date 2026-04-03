package com.pos.controller;

import com.pos.dto.CouponPreviewResponseDTO;
import com.pos.dto.OrderRequestDTO;
import com.pos.dto.OrderResponseDTO;
import com.pos.entity.Order;
import com.pos.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF')")
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @GetMapping("/{id:\\d+}/items")
    public ResponseEntity<List<OrderResponseDTO.ItemResponseDTO>> getOrderItems(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderItems(id));
    }

    @GetMapping("/coupon-preview")
    public ResponseEntity<CouponPreviewResponseDTO> previewCoupon(@RequestParam String couponCode,
                                                                   @RequestParam BigDecimal grossAmount) {
        return ResponseEntity.ok(orderService.previewCoupon(couponCode, grossAmount));
    }

    @PostMapping
    public ResponseEntity<OrderResponseDTO> createOrder(@RequestBody OrderRequestDTO dto) {
        return ResponseEntity.ok(orderService.createOrder(dto));
    }
}
