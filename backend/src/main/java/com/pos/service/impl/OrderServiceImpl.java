package com.pos.service.impl;

import com.pos.dto.OrderItemRequestDTO;
import com.pos.dto.OrderRequestDTO;
import com.pos.dto.OrderResponseDTO;
import com.pos.entity.*;
import com.pos.enums.OrderStatus;
import com.pos.enums.PaymentMethod;
import com.pos.enums.SalesChannel;
import com.pos.repository.*;
import com.pos.security.CustomUserDetails;
import com.pos.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final InventoryMovementRepository movementRepository;
    private final WarehouseRepository warehouseRepository;

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
    @Transactional
    public OrderResponseDTO createOrder(OrderRequestDTO req) {
                Staff staff = getAuthenticatedStaff();

        Customer customer = null;
        if (req.getCustomerId() != null) {
            customer = customerRepository.findById(req.getCustomerId())
                    .orElseThrow(() -> new RuntimeException("Customer not found"));
        }

                if (req.getPaymentMethod() == PaymentMethod.DEBT && customer == null) {
                        throw new RuntimeException("Customer is required for DEBT payment");
                }

        // Lấy kho từ request (bắt buộc)
        Warehouse warehouse = warehouseRepository.findById(req.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found: " + req.getWarehouseId()));

        // Tạo Order Entity
        Order order = Order.builder()
                .salesChannel(SalesChannel.POS)
                .customer(customer)
                .warehouse(warehouse)
                .orderTime(LocalDateTime.now())
                .status(OrderStatus.COMPLETED) // Bán POS là Hoàn Thành ngay
                .discountAmount(req.getDiscountAmount() != null ? req.getDiscountAmount() : BigDecimal.ZERO)
                .couponCode(req.getCouponCode())
                .couponDiscountAmount(req.getCouponDiscountAmount() != null ? req.getCouponDiscountAmount() : BigDecimal.ZERO)
                .surchargeAmount(req.getSurchargeAmount() != null ? req.getSurchargeAmount() : BigDecimal.ZERO)
                .paymentMethod(req.getPaymentMethod() != null ? req.getPaymentMethod() : PaymentMethod.CASH)
                .note(req.getNote())
                .createdBy(staff)
                .build();

        BigDecimal grossAmount = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (OrderItemRequestDTO itemReq : req.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + itemReq.getProductId()));

            // Tính doanh thu, vốn, lãi
            BigDecimal lineRevenue = itemReq.getSalePrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            BigDecimal lineCogs = product.getAvgCost().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            BigDecimal lineProfit = lineRevenue.subtract(lineCogs);

            grossAmount = grossAmount.add(lineRevenue);

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
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

        order.setGrossAmount(grossAmount);
        
        // Tính tổng phải trả NetAmount
        BigDecimal netAmount = grossAmount
                .subtract(order.getDiscountAmount())
                .subtract(order.getCouponDiscountAmount())
                .add(order.getSurchargeAmount());
                
        order.setNetAmount(netAmount);

        orderRepository.saveAndFlush(order);
        String generatedOrderNo = orderRepository.findOrderNoById(order.getId());
        
        List<OrderItem> savedItems = orderItemRepository.saveAll(orderItems);

        // Sinh Movement (dùng lại warehouse đã lấy từ request)
        for (OrderItem savedItem : savedItems) {
            InventoryMovement movement = InventoryMovement.builder()
                    .product(savedItem.getProduct())
                    .warehouse(warehouse)
                    .movementType(com.pos.enums.InventoryMovementType.SALE_OUT)
                    .qty(savedItem.getQty()) 
                    .refTable("orders")
                    .refId(generatedOrderNo)
                    .createdBy(staff)
                    .build();
            movementRepository.save(movement);
        }

        // Chuyển Type sang DTO trả về cho Frontend
        OrderResponseDTO res = new OrderResponseDTO();
        res.setId(order.getId());
        res.setOrderNo(generatedOrderNo);
        res.setStatus(order.getStatus());
        res.setNetAmount(order.getNetAmount());
        res.setPaymentMethod(order.getPaymentMethod());

        return res;
    }

        private Staff getAuthenticatedStaff() {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
                        throw new RuntimeException("Unauthenticated request");
                }
                return userDetails.getStaff();
        }
}
