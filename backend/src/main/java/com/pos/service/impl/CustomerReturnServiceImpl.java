package com.pos.service.impl;

import com.pos.dto.CustomerReturnRequestDTO;
import com.pos.dto.CustomerReturnResponseDTO;
import com.pos.entity.*;
import com.pos.enums.DocumentStatus;
import com.pos.repository.*;
import com.pos.service.CustomerReturnService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
    public CustomerReturnResponseDTO createCustomerReturn(CustomerReturnRequestDTO dto) {
        validateItemList(dto.getItems());

        Customer customer = customerRepository.findById(UUID.fromString(dto.getCustomerId()))
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        Staff staff = staffRepository.findById(dto.getCreatedByStaffId())
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        Order order = null;
        if (dto.getOrderId() != null) {
            order = orderRepository.findById(dto.getOrderId()).orElse(null);
        }

        Warehouse warehouse = warehouseRepository.findById(dto.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));

        BigDecimal totalRefund = calculateTotalRefund(dto.getItems());

        CustomerReturn cr = CustomerReturn.builder()
                .customer(customer)
                .order(order)
                .warehouse(warehouse)
                .returnDate(LocalDate.now())
                .status(DocumentStatus.DRAFT)
                .note(dto.getNote())
                .totalRefund(totalRefund)
                .createdBy(staff)
                .build();

        crRepository.saveAndFlush(cr);
        String generatedReturnNo = crRepository.findReturnNoById(cr.getId());
        cr.setReturnNo(generatedReturnNo);
        
        for (CustomerReturnRequestDTO.ReturnItemRequestDTO itemDto : dto.getItems()) {
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

        return toResponseDTO(cr);
    }

    @Override
    @Transactional
    public CustomerReturnResponseDTO updateDraftCustomerReturn(Long id, CustomerReturnRequestDTO dto) {
        validateItemList(dto.getItems());

        CustomerReturn cr = getCustomerReturnById(id);
        if (cr.getStatus() != DocumentStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT customer return can be updated");
        }

        Customer customer = customerRepository.findById(UUID.fromString(dto.getCustomerId()))
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Order order = null;
        if (dto.getOrderId() != null) {
            order = orderRepository.findById(dto.getOrderId()).orElse(null);
        }

        Warehouse warehouse = warehouseRepository.findById(dto.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));

        cr.setCustomer(customer);
        cr.setOrder(order);
        cr.setWarehouse(warehouse);
        cr.setNote(dto.getNote());
        cr.setTotalRefund(calculateTotalRefund(dto.getItems()));

        crItemRepository.deleteByCustomerReturnId(cr.getId());
        for (CustomerReturnRequestDTO.ReturnItemRequestDTO itemDto : dto.getItems()) {
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
                    .refundAmount(itemDto.getRefundAmount())
                    .build();

            crItemRepository.save(item);
        }

        return toResponseDTO(crRepository.save(cr));
    }

    @Override
    @Transactional
    public CustomerReturnResponseDTO completeCustomerReturn(Long id) {
        CustomerReturn cr = getCustomerReturnById(id);

        if (cr.getStatus() == DocumentStatus.CANCELLED) {
            throw new RuntimeException("Cancelled return cannot be completed");
        }
        if (cr.getStatus() == DocumentStatus.POSTED) {
            throw new RuntimeException("Return already completed");
        }
        
        cr.setStatus(DocumentStatus.POSTED);
        crRepository.save(cr);

        List<CustomerReturnItem> items = crItemRepository.findByCustomerReturnId(cr.getId());

        for (CustomerReturnItem item : items) {
            Product product = item.getProduct();

            InventoryMovement act = InventoryMovement.builder()
                    .product(product)
                    .warehouse(cr.getWarehouse())
                    .movementType(com.pos.enums.InventoryMovementType.RETURN_IN)
                    .qty(item.getQty())
                    .refTable("customer_returns")
                    .refId(cr.getReturnNo())
                    .createdBy(cr.getCreatedBy())
                    .build();

            movementRepository.save(act);
        }
        return toResponseDTO(cr);
    }

    private void validateItemList(List<CustomerReturnRequestDTO.ReturnItemRequestDTO> items) {
        if (items == null || items.isEmpty()) {
            throw new RuntimeException("Customer return items are required");
        }
        for (CustomerReturnRequestDTO.ReturnItemRequestDTO itemDto : items) {
            if (itemDto.getQty() == null || itemDto.getQty() <= 0) {
                throw new RuntimeException("qty must be greater than 0");
            }
            if (itemDto.getRefundAmount() == null || itemDto.getRefundAmount().compareTo(BigDecimal.ZERO) < 0) {
                throw new RuntimeException("refundAmount must be >= 0");
            }
        }
    }

    private BigDecimal calculateTotalRefund(List<CustomerReturnRequestDTO.ReturnItemRequestDTO> items) {
        BigDecimal totalRefund = BigDecimal.ZERO;
        for (CustomerReturnRequestDTO.ReturnItemRequestDTO itemDto : items) {
            totalRefund = totalRefund.add(itemDto.getRefundAmount());
        }
        return totalRefund;
    }

    private CustomerReturnResponseDTO toResponseDTO(CustomerReturn cr) {
        CustomerReturnResponseDTO res = new CustomerReturnResponseDTO();
        res.setId(cr.getId());
        res.setReturnNo(cr.getReturnNo());
        res.setStatus(cr.getStatus());
        res.setTotalRefund(cr.getTotalRefund());
        return res;
    }
}
