package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.dto.CouponPreviewResponseDTO;
import IUH.KLTN.LvsH.dto.OrderRequestDTO;
import IUH.KLTN.LvsH.dto.OrderResponseDTO;
import IUH.KLTN.LvsH.entity.Coupon;
import IUH.KLTN.LvsH.entity.Order;
import IUH.KLTN.LvsH.entity.Product;
import IUH.KLTN.LvsH.entity.Staff;
import IUH.KLTN.LvsH.entity.Warehouse;
import IUH.KLTN.LvsH.enums.DocumentStatus;
import IUH.KLTN.LvsH.enums.PaymentMethod;
import IUH.KLTN.LvsH.repository.CouponRepository;
import IUH.KLTN.LvsH.repository.CustomerRepository;
import IUH.KLTN.LvsH.repository.InventoryMovementRepository;
import IUH.KLTN.LvsH.repository.OrderItemRepository;
import IUH.KLTN.LvsH.repository.OrderRepository;
import IUH.KLTN.LvsH.repository.ProductRepository;
import IUH.KLTN.LvsH.repository.WarehouseRepository;
import IUH.KLTN.LvsH.security.CustomUserDetails;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private InventoryMovementRepository movementRepository;
    @Mock
    private WarehouseRepository warehouseRepository;
    @Mock
    private CouponRepository couponRepository;

    @InjectMocks
    private OrderServiceImpl service;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createOrder_shouldRejectInvalidCoupon() {
        mockAuthenticatedStaff();

        OrderRequestDTO req = buildBasicOrderRequest();
        req.setCouponCode("INVALID");

        Warehouse warehouse = Warehouse.builder().id(1L).build();
        Product product = Product.builder().id(1L).avgCost(BigDecimal.valueOf(50)).build();

        when(warehouseRepository.findById(1L)).thenReturn(Optional.of(warehouse));
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(couponRepository.findByCodeAndDeletedAtIsNull("INVALID")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.createOrder(req));
    }

    @Test
    void createOrder_shouldComputeCouponOnBackendAndIncreaseUsedCount() {
        mockAuthenticatedStaff();

        OrderRequestDTO req = buildBasicOrderRequest();
        req.setCouponCode("SAVE10");
        req.setDiscountAmount(BigDecimal.ZERO);
        req.setSurchargeAmount(BigDecimal.ZERO);

        Warehouse warehouse = Warehouse.builder().id(1L).build();
        Product product = Product.builder().id(1L).avgCost(BigDecimal.valueOf(50)).build();
        Coupon coupon = Coupon.builder()
                .id(1L)
                .code("SAVE10")
                .discountType("PERCENT")
                .discountValue(BigDecimal.TEN)
                .isActive(true)
                .usageLimit(10)
                .usedCount(1)
                .startsAt(LocalDateTime.now().minusDays(1))
                .endsAt(LocalDateTime.now().plusDays(1))
                .build();

        when(warehouseRepository.findById(1L)).thenReturn(Optional.of(warehouse));
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(couponRepository.findByCodeAndDeletedAtIsNull("SAVE10")).thenReturn(Optional.of(coupon));
        when(orderRepository.findOrderNoById(1L)).thenReturn("SO-0001");
        when(orderItemRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        when(orderRepository.saveAndFlush(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            order.setId(1L);
            return order;
        });

        OrderResponseDTO response = service.createOrder(req);

        assertEquals(DocumentStatus.POSTED, response.getStatus());

        ArgumentCaptor<Order> orderCaptor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).saveAndFlush(orderCaptor.capture());
        Order persistedOrder = orderCaptor.getValue();
        assertEquals(new BigDecimal("20.00"), persistedOrder.getCouponDiscountAmount());
        assertEquals(new BigDecimal("180.00"), persistedOrder.getNetAmount());

        ArgumentCaptor<Coupon> couponCaptor = ArgumentCaptor.forClass(Coupon.class);
        verify(couponRepository).save(couponCaptor.capture());
        assertEquals(2, couponCaptor.getValue().getUsedCount());
    }

    @Test
    void previewCoupon_shouldReturnInvalidWhenNotFound() {
        when(couponRepository.findByCodeAndDeletedAtIsNull("NOTFOUND")).thenReturn(Optional.empty());

        CouponPreviewResponseDTO response = service.previewCoupon("NOTFOUND", new BigDecimal("200"));

        assertFalse(response.isValid());
        assertEquals(BigDecimal.ZERO, response.getDiscountAmount());
        assertTrue(response.getMessage().contains("Coupon not found"));
    }

    private void mockAuthenticatedStaff() {
        Staff staff = Staff.builder()
                .id(1L)
                .username("admin")
                .passwordHash("x")
                .role("ADMIN")
                .isActive(true)
                .build();

        CustomUserDetails userDetails = new CustomUserDetails(staff);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private OrderRequestDTO buildBasicOrderRequest() {
        OrderRequestDTO.ItemRequestDTO item = new OrderRequestDTO.ItemRequestDTO();
        item.setProductId(1L);
        item.setQuantity(2);
        item.setSalePrice(new BigDecimal("100"));

        OrderRequestDTO req = new OrderRequestDTO();
        req.setWarehouseId(1L);
        req.setPaymentMethod(PaymentMethod.CASH);
        req.setItems(List.of(item));
        return req;
    }
}
