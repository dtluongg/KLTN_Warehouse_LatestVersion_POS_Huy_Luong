package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.dto.CouponPreviewResponseDTO;
import IUH.KLTN.LvsH.dto.OrderRequestDTO;
import IUH.KLTN.LvsH.dto.OrderResponseDTO;
import IUH.KLTN.LvsH.entity.*;
import IUH.KLTN.LvsH.enums.DocumentStatus;
import IUH.KLTN.LvsH.enums.PaymentMethod;
import IUH.KLTN.LvsH.enums.SalesChannel;
import IUH.KLTN.LvsH.repository.*;
import IUH.KLTN.LvsH.security.CustomUserDetails;
import IUH.KLTN.LvsH.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final InventoryMovementRepository movementRepository;
    private final WarehouseRepository warehouseRepository;
        private final CouponRepository couponRepository;

    @Override
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @Override
    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found: " + id));
    }

    @Override
    @Transactional(readOnly = true)
        public List<OrderResponseDTO.ItemResponseDTO> getOrderItems(Long orderId) {
        // Ensure the order exists before fetching items.
        getOrderById(orderId);
        return orderItemRepository.findByOrderId(orderId)
                .stream()
            .map(item -> OrderResponseDTO.ItemResponseDTO.builder()
                        .id(item.getId())
                        .qty(item.getQty())
                        .salePrice(item.getSalePrice())
                        .lineRevenue(item.getLineRevenue())
                .product(OrderResponseDTO.ProductLiteDTO.builder()
                                .id(item.getProduct().getId())
                                .sku(item.getProduct().getSku())
                                .name(item.getProduct().getName())
                                .build())
                        .build())
                .collect(Collectors.toList());
    }

        @Override
        @Transactional(readOnly = true)
        public CouponPreviewResponseDTO previewCoupon(String couponCode, BigDecimal grossAmount) {
                CouponPreviewResponseDTO response = new CouponPreviewResponseDTO();
                BigDecimal safeGross = grossAmount == null ? BigDecimal.ZERO : grossAmount.max(BigDecimal.ZERO);
                String normalizedCouponCode = normalizeCouponCode(couponCode);

                response.setCouponCode(normalizedCouponCode);
                response.setGrossAmount(safeGross);

                try {
                        CouponCalculation calc = calculateCouponOrThrow(normalizedCouponCode, safeGross, LocalDateTime.now());
                        response.setValid(true);
                        response.setDiscountAmount(calc.discountAmount);
                        response.setPayableAmount(safeGross.subtract(calc.discountAmount).max(BigDecimal.ZERO));
                        response.setMessage("Coupon is valid");
                } catch (RuntimeException ex) {
                        response.setValid(false);
                        response.setDiscountAmount(BigDecimal.ZERO);
                        response.setPayableAmount(safeGross);
                        response.setMessage(ex.getMessage());
                }

                return response;
        }

    @Override
    @Transactional
    public OrderResponseDTO createOrder(OrderRequestDTO req) {
        Staff staff = getAuthenticatedStaff();

        if (req.getItems() == null || req.getItems().isEmpty()) {
            throw new RuntimeException("Order items are required");
        }

        Customer customer = null;
        if (req.getCustomerId() != null) {
            customer = customerRepository.findById(req.getCustomerId())
                    .orElseThrow(() -> new RuntimeException("Customer not found"));
        }

        if (req.getPaymentMethod() == PaymentMethod.DEBT && customer == null) {
            throw new RuntimeException("Customer is required for DEBT payment");
        }

        // Láº¥y kho tá»« request (báº¯t buá»™c)
        Warehouse warehouse = warehouseRepository.findById(req.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found: " + req.getWarehouseId()));

        BigDecimal grossAmount = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (OrderRequestDTO.ItemRequestDTO itemReq : req.getItems()) {
            if (itemReq.getQuantity() == null || itemReq.getQuantity() <= 0) {
                throw new RuntimeException("quantity must be greater than 0");
            }
            if (itemReq.getSalePrice() == null || itemReq.getSalePrice().compareTo(BigDecimal.ZERO) < 0) {
                throw new RuntimeException("salePrice must be >= 0");
            }

            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + itemReq.getProductId()));

            // Validate on_hand before selling
            int onHand = productRepository.calculateOnHandByWarehouseAndProductId(warehouse.getId(), product.getId());
            if (onHand < itemReq.getQuantity()) {
                throw new RuntimeException("Insufficient stock for product: " + product.getSku() + 
                    ". Available: " + onHand + ", Requested: " + itemReq.getQuantity());
            }

            BigDecimal lineRevenue = itemReq.getSalePrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            BigDecimal lineCogs = product.getAvgCost().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            BigDecimal lineProfit = lineRevenue.subtract(lineCogs);

            grossAmount = grossAmount.add(lineRevenue);

            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .qty(itemReq.getQuantity())
                    .salePrice(itemReq.getSalePrice())
                    .costAtSale(product.getAvgCost())
                    .lineRevenue(lineRevenue)
                    .lineCogs(lineCogs)
                    .lineProfit(lineProfit)
                    .build();

            orderItems.add(orderItem);
        }

        BigDecimal discountAmount = req.getDiscountAmount() != null ? req.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal surchargeAmount = req.getSurchargeAmount() != null ? req.getSurchargeAmount() : BigDecimal.ZERO;

        CouponCalculation couponCalculation = null;
        String normalizedCouponCode = normalizeCouponCode(req.getCouponCode());
        if (normalizedCouponCode != null) {
            couponCalculation = calculateCouponOrThrow(normalizedCouponCode, grossAmount, LocalDateTime.now());
        }

        BigDecimal couponDiscountAmount = couponCalculation != null ? couponCalculation.discountAmount : BigDecimal.ZERO;

        // Táº¡o Order Entity
        Order order = Order.builder()
                .salesChannel(SalesChannel.POS)
                .customer(customer)
                .warehouse(warehouse)
                .orderTime(LocalDateTime.now())
                .status(DocumentStatus.POSTED) // BÃ¡n POS lÃ  chá»‘t ngay
                .discountAmount(discountAmount)
                .couponCode(couponCalculation != null ? couponCalculation.coupon.getCode() : null)
                .couponDiscountAmount(couponDiscountAmount)
                .surchargeAmount(surchargeAmount)
                .paymentMethod(req.getPaymentMethod() != null ? req.getPaymentMethod() : PaymentMethod.CASH)
                .note(req.getNote())
                .createdBy(staff)
                .build();

        for (OrderItem orderItem : orderItems) {
            orderItem.setOrder(order);
        }

        order.setGrossAmount(grossAmount);
        
        // TÃ­nh tá»•ng pháº£i tráº£ NetAmount
        BigDecimal netAmount = grossAmount
                .subtract(order.getDiscountAmount())
                .subtract(order.getCouponDiscountAmount())
                .add(order.getSurchargeAmount());

        order.setNetAmount(netAmount.max(BigDecimal.ZERO));

        orderRepository.saveAndFlush(order);
        String generatedOrderNo = orderRepository.findOrderNoById(order.getId());

        if (couponCalculation != null) {
            int currentUsed = couponCalculation.coupon.getUsedCount() == null ? 0 : couponCalculation.coupon.getUsedCount();
            couponCalculation.coupon.setUsedCount(currentUsed + 1);
            couponRepository.save(couponCalculation.coupon);
        }
        
        List<OrderItem> savedItems = orderItemRepository.saveAll(orderItems);

        // Sinh Movement (dÃ¹ng láº¡i warehouse Ä‘Ã£ láº¥y tá»« request)
        for (OrderItem savedItem : savedItems) {
            InventoryMovement movement = InventoryMovement.builder()
                    .product(savedItem.getProduct())
                    .warehouse(warehouse)
                    .movementType(IUH.KLTN.LvsH.enums.InventoryMovementType.SALE_OUT)
                    .qty(savedItem.getQty()) 
                    .refTable("orders")
                    .refId(generatedOrderNo)
                    .createdBy(staff)
                    .build();
            movementRepository.save(movement);
        }

        // Chuyá»ƒn Type sang DTO tráº£ vá» cho Frontend
        OrderResponseDTO res = new OrderResponseDTO();
        res.setId(order.getId());
        res.setOrderNo(generatedOrderNo);
        res.setStatus(order.getStatus());
        res.setNetAmount(order.getNetAmount());
        res.setPaymentMethod(order.getPaymentMethod());

        return res;
    }

    private CouponCalculation calculateCouponOrThrow(String couponCode, BigDecimal grossAmount, LocalDateTime now) {
        if (couponCode == null || couponCode.isBlank()) {
            throw new RuntimeException("Coupon code is required");
        }

        Coupon coupon = couponRepository.findByCodeAndDeletedAtIsNull(couponCode)
                .orElseThrow(() -> new RuntimeException("Coupon not found: " + couponCode));

        if (!Boolean.TRUE.equals(coupon.getIsActive())) {
            throw new RuntimeException("Coupon is inactive");
        }
        if (coupon.getStartsAt() != null && now.isBefore(coupon.getStartsAt())) {
            throw new RuntimeException("Coupon is not started yet");
        }
        if (coupon.getEndsAt() != null && now.isAfter(coupon.getEndsAt())) {
            throw new RuntimeException("Coupon is expired");
        }

        int usedCount = coupon.getUsedCount() == null ? 0 : coupon.getUsedCount();
        if (coupon.getUsageLimit() != null && usedCount >= coupon.getUsageLimit()) {
            throw new RuntimeException("Coupon usage limit reached");
        }

        if (coupon.getMinOrderAmount() != null && grossAmount.compareTo(coupon.getMinOrderAmount()) < 0) {
            throw new RuntimeException("Order amount does not meet coupon minimum");
        }

        BigDecimal discountAmount;
        String discountType = coupon.getDiscountType() == null ? "" : coupon.getDiscountType().trim().toUpperCase();
        switch (discountType) {
            case "PERCENT" -> discountAmount = grossAmount
                    .multiply(coupon.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            case "FIXED" -> discountAmount = coupon.getDiscountValue();
            default -> throw new RuntimeException("Unsupported coupon type: " + coupon.getDiscountType());
        }

        if (discountAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Coupon discount must be >= 0");
        }
        if (coupon.getMaxDiscountAmount() != null && discountAmount.compareTo(coupon.getMaxDiscountAmount()) > 0) {
            discountAmount = coupon.getMaxDiscountAmount();
        }
        if (discountAmount.compareTo(grossAmount) > 0) {
            discountAmount = grossAmount;
        }

        return new CouponCalculation(coupon, discountAmount);
    }

    private String normalizeCouponCode(String couponCode) {
        if (couponCode == null) {
            return null;
        }
        String normalized = couponCode.trim();
        return normalized.isEmpty() ? null : normalized.toUpperCase();
    }

    private Staff getAuthenticatedStaff() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new RuntimeException("Unauthenticated request");
        }
        return userDetails.getStaff();
    }

    private static class CouponCalculation {
        private final Coupon coupon;
        private final BigDecimal discountAmount;

        private CouponCalculation(Coupon coupon, BigDecimal discountAmount) {
            this.coupon = coupon;
            this.discountAmount = discountAmount;
        }
    }
}
