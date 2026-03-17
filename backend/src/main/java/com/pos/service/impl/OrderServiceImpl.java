package com.pos.service.impl;

import com.pos.dto.CreateOrderDto;
import com.pos.entity.*;
import com.pos.repository.*;
import com.pos.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final StaffRepository staffRepository;
    private final CouponRepository couponRepository;
    private final InventoryMovementRepository movementRepository;
    // Tạm lấy Warehouse đầu tiên cho bán lẻ (Sau này phát triển đa kho sẽ select từ token/request)
    private final WarehouseRepository warehouseRepository;

    @Override
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @Override
    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }

    @Override
    @Transactional
    public Order createOrder(CreateOrderDto dto) {
        Customer customer = null;
        if (dto.getCustomerId() != null && !dto.getCustomerId().isEmpty()) {
            customer = customerRepository.findById(UUID.fromString(dto.getCustomerId())).orElse(null);
        }
        Staff staff = staffRepository.findById(dto.getCreatedByStaffId())
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        Order order = Order.builder()
                .orderNo(dto.getOrderNo())
                .salesChannel(dto.getSalesChannel())
                .customer(customer)
                .orderTime(LocalDateTime.now())
                .status("DRAFT")
                .paymentMethod(dto.getPaymentMethod())
                .note(dto.getNote())
                .createdBy(staff)
                .build();

        // 1. Lưu Order (DRAFT)
        order = orderRepository.save(order);
        
        BigDecimal grossAmount = BigDecimal.ZERO;

        // 2. Lưu Order Items (Chụp avgCost khoảnh khắc bán)
        for (CreateOrderDto.OrderItemDto itemDto : dto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            BigDecimal lineRevenue = itemDto.getSalePrice().multiply(BigDecimal.valueOf(itemDto.getQty()));
            // Snapshot giá vốn: Nếu chưa nhập bao giờ (0) thì lineCogs t= 0, nếu có avgCost thì lấy nó làm Cogs.
            BigDecimal costAtSale = product.getAvgCost(); 
            BigDecimal lineCogs = costAtSale.multiply(BigDecimal.valueOf(itemDto.getQty()));
            BigDecimal lineProfit = lineRevenue.subtract(lineCogs);

            OrderItem item = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .qty(itemDto.getQty())
                    .salePrice(itemDto.getSalePrice())
                    .costAtSale(costAtSale)
                    .lineRevenue(lineRevenue)
                    .lineCogs(lineCogs)
                    .lineProfit(lineProfit)
                    .build();

            orderItemRepository.save(item);
            grossAmount = grossAmount.add(lineRevenue);
        }

        order.setGrossAmount(grossAmount);
        
        // 3. Tính toán Discount & Coupon
        BigDecimal finalDiscount = dto.getDiscountAmount() != null ? dto.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal couponAmount = BigDecimal.ZERO;

        if (dto.getDiscountCouponCode() != null && !dto.getDiscountCouponCode().isEmpty()) {
            Coupon coupon = couponRepository.findByCode(dto.getDiscountCouponCode()).orElse(null);
            if (coupon != null && Boolean.TRUE.equals(coupon.getIsActive())) {
                // Giả định logic đơn giản tính PERCENT hoặc FIXED (Ở MVP coi như FIXED)
                couponAmount = coupon.getDiscountValue();
                order.setCouponCode(coupon.getCode());
                // Increment use count
                coupon.setUsedCount(coupon.getUsedCount() + 1);
                couponRepository.save(coupon);
            }
        }

        BigDecimal finalSurcharge = dto.getSurchargeAmount() != null ? dto.getSurchargeAmount() : BigDecimal.ZERO;
        order.setDiscountAmount(finalDiscount);
        order.setCouponDiscountAmount(couponAmount);
        order.setSurchargeAmount(finalSurcharge);
        
        // Net = Gross - Discount - Coupon + Surcharge
        BigDecimal netAmount = grossAmount.subtract(finalDiscount).subtract(couponAmount).add(finalSurcharge);
        order.setNetAmount(netAmount);

        return orderRepository.save(order);
    }

    @Override
    @Transactional
    public Order completeOrder(Long id) {
        Order order = getOrderById(id);
        if ("COMPLETED".equals(order.getStatus())) {
            throw new RuntimeException("Order already completed");
        }
        
        order.setStatus("COMPLETED");
        orderRepository.save(order);

        // Giả sử có 1 kho duy nhất tên 'MAIN_WH' để trừ tồn. Nếu có nhiều có thể lấy kho từ Session
        Warehouse mainWh = warehouseRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new RuntimeException("No Warehouse found"));

        List<OrderItem> items = orderItemRepository.findAll();

        for (OrderItem item : items) {
            if (item.getOrder().getId().equals(order.getId())) {
                Product product = item.getProduct();
                
                // Trừ tồn kho
                int newQty = product.getOnHand() - item.getQty();
                product.setOnHand(newQty);
                productRepository.save(product);

                // Ghi nhận Movement OUT
                InventoryMovement act = InventoryMovement.builder()
                        .product(product)
                        .warehouse(mainWh)
                        .movementType("OUT")
                        .qty(-item.getQty()) // OUT thì lữu số âm hoặc quy ước OUT
                        .unitCost(item.getCostAtSale()) // Giá xuất kho là avgCost được snapshot vào lúc sale
                        .refType("ORDER")
                        .refId(String.valueOf(order.getId()))
                        .createdBy(order.getCreatedBy())
                        .build();

                movementRepository.save(act);
            }
        }
        return order;
    }
}
