package com.pos.service.impl;

import com.pos.dto.CreateCustomerReturnDto;
import com.pos.entity.*;
import com.pos.repository.*;
import com.pos.service.CustomerReturnService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerReturnServiceImpl implements CustomerReturnService {

    private final CustomerReturnRepository crRepository;
    private final CustomerReturnItemRepository crItemRepository;
    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final StaffRepository staffRepository;
    private final InventoryMovementRepository movementRepository;
    private final WarehouseRepository warehouseRepository;

    @Override
    public List<CustomerReturn> getAllCustomerReturns() {
        return crRepository.findAll();
    }

    @Override
    public CustomerReturn getCustomerReturnById(Long id) {
        return crRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer Return not found"));
    }

    @Override
    @Transactional
    public CustomerReturn createCustomerReturn(CreateCustomerReturnDto dto) {
        Customer customer = customerRepository.findById(UUID.fromString(dto.getCustomerId()))
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        Staff staff = staffRepository.findById(dto.getCreatedByStaffId())
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        Order order = null;
        if (dto.getOrderId() != null) {
            order = orderRepository.findById(dto.getOrderId()).orElse(null);
        }

        CustomerReturn cr = CustomerReturn.builder()
                .returnNo(dto.getReturnNo())
                .customer(customer)
                .order(order)
                .returnDate(LocalDate.now())
                .status("DRAFT")
                .note(dto.getNote())
                .createdBy(staff)
                .build();

        cr = crRepository.save(cr);

        for (CreateCustomerReturnDto.ReturnItemDto itemDto : dto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            OrderItem orderItem = null;
            if (itemDto.getOrderItemId() != null) {
                orderItem = orderItemRepository.findById(itemDto.getOrderItemId()).orElse(null);
            }

            CustomerReturnItem item = CustomerReturnItem.builder()
                    .customerReturn(cr)
                    .orderItem(orderItem)
                    .product(product)
                    .qty(itemDto.getQty())
                    .refundAmount(itemDto.getRefundAmount()) // Số tiền trả lại cho khách
                    .build();

            crItemRepository.save(item);
        }

        return cr;
    }

    @Override
    @Transactional
    public CustomerReturn completeCustomerReturn(Long id) {
        CustomerReturn cr = getCustomerReturnById(id);
        
        if ("COMPLETED".equals(cr.getStatus())) {
            throw new RuntimeException("Return already completed");
        }
        
        cr.setStatus("COMPLETED");
        crRepository.save(cr);

        Warehouse mainWh = warehouseRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new RuntimeException("No Warehouse found"));

        List<CustomerReturnItem> items = crItemRepository.findAll();
        
        for (CustomerReturnItem item : items) {
            if (item.getCustomerReturn().getId().equals(cr.getId())) {
                Product product = item.getProduct();
                
                // Khách trả hàng -> Hàng nhập lại vào kho
                int newQty = product.getOnHand() + item.getQty();
                product.setOnHand(newQty);
                // Ghi chú: Có thể tính lại Moving Average nếu muốn, nhưng thông thường hàng trả lại 
                // giữ nguyên hoặc lấy lại avgCost cũ. Ở MVP này tạm thời giữ nguyên giá avgCost.
                productRepository.save(product);

                // Inventory Movement
                InventoryMovement act = InventoryMovement.builder()
                        .product(product)
                        .warehouse(mainWh) // Nhập lại vào MAIN_WH
                        .movementType("IN") // IN vì hàng từ tay KH quay về KHO
                        .qty(item.getQty()) 
                        .unitCost(product.getAvgCost()) // Book giá trị bằng AvgCost hiện tại
                        .refType("CUSTOMER_RETURN")
                        .refId(String.valueOf(cr.getId()))
                        .createdBy(cr.getCreatedBy())
                        .build();

                movementRepository.save(act);
            }
        }
        return cr;
    }
}
