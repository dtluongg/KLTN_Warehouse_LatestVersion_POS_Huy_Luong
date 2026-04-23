package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.dto.CouponPreviewResponseDTO;
import IUH.KLTN.LvsH.dto.order.*;
import IUH.KLTN.LvsH.entity.*;
import IUH.KLTN.LvsH.enums.DocumentStatus;
import IUH.KLTN.LvsH.enums.PaymentMethod;
import IUH.KLTN.LvsH.enums.SalesChannel;
import IUH.KLTN.LvsH.repository.*;
import IUH.KLTN.LvsH.repository.specification.OrderSpecification;
import IUH.KLTN.LvsH.security.CustomUserDetails;
import IUH.KLTN.LvsH.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    public Page<OrderListResponseDTO> getAllOrders(OrderSearchCriteria criteria, Pageable pageable) {
        Page<Order> page = orderRepository.findAll(OrderSpecification.withCriteria(criteria), pageable);
        return page.map(o -> OrderListResponseDTO.builder()
                .id(o.getId())
                .orderNo(o.getOrderNo())
                .salesChannel(o.getSalesChannel().name())
                .customerName(o.getCustomer() != null ? o.getCustomer().getName() : null)
                .warehouseName(o.getWarehouse().getName())
                .orderTime(o.getOrderTime())
                .status(o.getStatus().name())
                .netAmount(o.getNetAmount())
                .grossAmount(o.getGrossAmount())
                .discountAmount(o.getDiscountAmount())
                .couponDiscountAmount(o.getCouponDiscountAmount())
                .surchargeAmount(o.getSurchargeAmount())
                .note(o.getNote())
                .paymentMethod(o.getPaymentMethod().name())
                .createdBy(o.getCreatedBy().getFullName())
                .build());
    }

    private Order getOrderEntityById(Long id) {
        return orderRepository.findById(id).orElseThrow(() -> new RuntimeException("Order not found: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDetailResponseDTO getOrderDetailById(Long id) {
        Order o = getOrderEntityById(id);
        List<OrderItem> items = orderItemRepository.findByOrderId(o.getId());
        
        List<OrderDetailResponseDTO.OrderItemResponseDTO> itemDTOs = items.stream().map(i -> OrderDetailResponseDTO.OrderItemResponseDTO.builder()
                .id(i.getId())
                .productId(i.getProduct().getId())
                .productSku(i.getProduct().getSku())
                .productName(i.getProduct().getName())
                .qty(i.getQty())
                .salePrice(i.getSalePrice())
                .lineRevenue(i.getLineRevenue())
                .build()).collect(Collectors.toList());

        return OrderDetailResponseDTO.builder()
                .id(o.getId())
                .orderNo(o.getOrderNo())
                .salesChannel(o.getSalesChannel().name())
                .customerId(o.getCustomer() != null ? o.getCustomer().getId() : null)
                .customerName(o.getCustomer() != null ? o.getCustomer().getName() : null)
                .customerPhone(o.getCustomer() != null ? o.getCustomer().getPhone() : null)
                .warehouseId(o.getWarehouse().getId())
                .warehouseName(o.getWarehouse().getName())
                .orderTime(o.getOrderTime())
                .status(o.getStatus().name())
                .paymentMethod(o.getPaymentMethod().name())
                .payosOrderCode(o.getPayosOrderCode())
                .note(o.getNote())
                .grossAmount(o.getGrossAmount())
                .discountAmount(o.getDiscountAmount())
                .couponCode(o.getCouponCode())
                .couponDiscountAmount(o.getCouponDiscountAmount())
                .surchargeAmount(o.getSurchargeAmount())
                .netAmount(o.getNetAmount())
                .createdBy(o.getCreatedBy().getFullName())
                .createdAt(o.getCreatedAt())
                .items(itemDTOs)
                .build();
    }
    
        @Override
        @Transactional
        public OrderDetailResponseDTO changePaymentMethod(Long orderId, PaymentMethod paymentMethod) {
            Order order = getOrderEntityById(orderId);
            if (order.getStatus() != DocumentStatus.DRAFT) {
                throw new RuntimeException("Chỉ được đổi phương thức thanh toán khi đơn hàng đang ở trạng thái DRAFT");
            }
            order.setPaymentMethod(paymentMethod);
            // Nếu đổi sang tiền mặt thì chuyển sang POSTED
            if (paymentMethod == PaymentMethod.CASH) {
                order.setStatus(DocumentStatus.POSTED);
            }
            orderRepository.save(order);
            return getOrderDetailById(orderId);
        }
    
        @Override
        @Transactional
        public OrderDetailResponseDTO cancelOrder(Long orderId) {
            Order order = getOrderEntityById(orderId);
            if (order.getStatus() != DocumentStatus.DRAFT) {
                throw new RuntimeException("Chỉ được huỷ đơn hàng khi đang ở trạng thái DRAFT");
            }
            order.setStatus(DocumentStatus.CANCELLED);
            orderRepository.save(order);
            return getOrderDetailById(orderId);
        }

    @Override
    @Transactional
    public OrderDetailResponseDTO createOrder(OrderRequestDTO req) {
        Staff staff = getAuthenticatedStaff();

        Customer customer = null;
        if (req.getCustomerId() != null) {
            customer = customerRepository.findById(req.getCustomerId())
                    .orElseThrow(() -> new RuntimeException("Customer not found"));
        }

        PaymentMethod pMethod = PaymentMethod.valueOf(req.getPaymentMethod().toUpperCase());
        if (pMethod == PaymentMethod.DEBT && customer == null) {
            throw new RuntimeException("Customer is required for DEBT payment");
        }
        else if (pMethod == PaymentMethod.TRANSFER) {
            
        }

        Warehouse warehouse = warehouseRepository.findById(req.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found: " + req.getWarehouseId()));

        BigDecimal grossAmount = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (OrderRequestDTO.OrderItemRequestDTO itemReq : req.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + itemReq.getProductId()));

            int onHand = productRepository.calculateOnHandByWarehouseAndProductId(warehouse.getId(), product.getId());
            if (onHand < itemReq.getQty()) {
                throw new RuntimeException("Insufficient stock for product: " + product.getSku() + 
                    ". Available: " + onHand + ", Requested: " + itemReq.getQty());
            }

            BigDecimal lineRevenue = itemReq.getSalePrice().multiply(BigDecimal.valueOf(itemReq.getQty()));
            BigDecimal lineCogs = product.getAvgCost().multiply(BigDecimal.valueOf(itemReq.getQty()));
            BigDecimal lineProfit = lineRevenue.subtract(lineCogs);

            grossAmount = grossAmount.add(lineRevenue);

            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .qty(itemReq.getQty())
                    .salePrice(itemReq.getSalePrice())
                    .costAtSale(product.getAvgCost())
                    .lineRevenue(lineRevenue)
                    .lineCogs(lineCogs)
                    .lineProfit(lineProfit)
                    .build();

            orderItems.add(orderItem);
        }

        CouponCalculation couponCalculation = null;
        String normalizedCouponCode = normalizeCouponCode(req.getCouponCode());
        if (normalizedCouponCode != null) {
            couponCalculation = calculateCouponOrThrow(normalizedCouponCode, grossAmount, LocalDateTime.now());
        }

        BigDecimal couponDiscountAmount = couponCalculation != null ? couponCalculation.discountAmount : BigDecimal.ZERO;
        BigDecimal discountAmount = req.getDiscountAmount() != null ? req.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal surchargeAmount = req.getSurchargeAmount() != null ? req.getSurchargeAmount() : BigDecimal.ZERO;

        DocumentStatus orderStatus = (pMethod == PaymentMethod.TRANSFER) ? DocumentStatus.DRAFT : DocumentStatus.POSTED;
        Order order = Order.builder()
            .salesChannel(SalesChannel.valueOf(req.getSalesChannel().toUpperCase()))
            .customer(customer)
            .warehouse(warehouse)
            .orderTime(LocalDateTime.now())
            .status(orderStatus)
            .couponCode(couponCalculation != null ? couponCalculation.coupon.getCode() : null)
            .couponDiscountAmount(couponDiscountAmount)
            .discountAmount(discountAmount)
            .surchargeAmount(surchargeAmount)
            .paymentMethod(pMethod)
            .note(req.getNote())
            .createdBy(staff)
            .build();

        for (OrderItem orderItem : orderItems) {
            orderItem.setOrder(order);
        }

        order.setGrossAmount(grossAmount);
        
        BigDecimal netAmount = grossAmount
                .subtract(discountAmount)
                .subtract(couponDiscountAmount)
                .add(surchargeAmount);

        order.setNetAmount(netAmount.max(BigDecimal.ZERO));

        orderRepository.saveAndFlush(order);
        String generatedOrderNo = orderRepository.findOrderNoById(order.getId());
        order.setOrderNo(generatedOrderNo);

        if (couponCalculation != null) {
            int currentUsed = couponCalculation.coupon.getUsedCount() == null ? 0 : couponCalculation.coupon.getUsedCount();
            couponCalculation.coupon.setUsedCount(currentUsed + 1);
            couponRepository.save(couponCalculation.coupon);
        }
        
        List<OrderItem> savedItems = orderItemRepository.saveAll(orderItems);

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

        return getOrderDetailById(order.getId());
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
