package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.dto.customer_return.*;
import IUH.KLTN.LvsH.entity.*;
import IUH.KLTN.LvsH.enums.DocumentStatus;
import IUH.KLTN.LvsH.repository.*;
import IUH.KLTN.LvsH.repository.specification.CustomerReturnSpecification;
import IUH.KLTN.LvsH.service.CustomerReturnService;
import IUH.KLTN.LvsH.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerReturnServiceImpl implements CustomerReturnService {

    private final CustomerReturnRepository crRepository;
    private final CustomerReturnItemRepository crItemRepository;
    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final InventoryMovementRepository movementRepository;
    private final WarehouseRepository warehouseRepository;

    @Override
    public Page<CustomerReturnListResponseDTO> getAllCustomerReturns(CustomerReturnSearchCriteria criteria, Pageable pageable) {
        Page<CustomerReturn> page = crRepository.findAll(CustomerReturnSpecification.withCriteria(criteria), pageable);
        return page.map(cr -> CustomerReturnListResponseDTO.builder()
                .id(cr.getId())
                .returnNo(cr.getReturnNo())
                .customerName(cr.getCustomer().getName())
                .orderId(cr.getOrder() != null ? cr.getOrder().getId() : null)
                .orderNo(cr.getOrder() != null ? cr.getOrder().getOrderNo() : null)
                .warehouseName(cr.getWarehouse().getName())
                .returnDate(cr.getReturnDate())
                .status(cr.getStatus().name())
                .totalRefund(cr.getTotalRefund())
                .createdBy(cr.getCreatedBy().getFullName())
                .createdAt(cr.getCreatedAt())
                .note(cr.getNote())
                .build());
    }

    private CustomerReturn getCustomerReturnEntityById(Long id) {
        return crRepository.findById(id).orElseThrow(() -> new RuntimeException("Customer Return not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerReturnDetailResponseDTO getCustomerReturnDetailById(Long id) {
        CustomerReturn cr = getCustomerReturnEntityById(id);
        List<CustomerReturnItem> items = crItemRepository.findByCustomerReturnId(cr.getId());
        
        List<CustomerReturnDetailResponseDTO.CustomerReturnItemResponseDTO> itemDTOs = items.stream().map(i -> 
                CustomerReturnDetailResponseDTO.CustomerReturnItemResponseDTO.builder()
                        .id(i.getId())
                        .productId(i.getProduct().getId())
                        .productSku(i.getProduct().getSku())
                        .productName(i.getProduct().getName())
                        .orderItemId(i.getOrderItem() != null ? i.getOrderItem().getId() : null)
                        .qty(i.getQty())
                        .refundAmount(i.getRefundAmount())
                        .build()
        ).collect(Collectors.toList());

        return CustomerReturnDetailResponseDTO.builder()
                .id(cr.getId())
                .returnNo(cr.getReturnNo())
                .customerId(cr.getCustomer().getId().toString())
                .customerName(cr.getCustomer().getName())
                .orderId(cr.getOrder() != null ? cr.getOrder().getId() : null)
                .orderNo(cr.getOrder() != null ? cr.getOrder().getOrderNo() : null)
                .warehouseId(cr.getWarehouse().getId())
                .warehouseName(cr.getWarehouse().getName())
                .returnDate(cr.getReturnDate())
                .status(cr.getStatus().name())
                .note(cr.getNote())
                .totalRefund(cr.getTotalRefund())
                .discountAmount(cr.getDiscountAmount())
                .surchargeAmount(cr.getSurchargeAmount())
                .createdBy(cr.getCreatedBy().getFullName())
                .createdAt(cr.getCreatedAt())
                .items(itemDTOs)
                .build();
    }

    @Override
    @Transactional
    public CustomerReturnDetailResponseDTO createCustomerReturn(CustomerReturnRequestDTO dto) {
        validateItemList(dto.getItems());

        Customer customer = customerRepository.findById(UUID.fromString(dto.getCustomerId()))
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        Staff staff = getAuthenticatedStaff();

        Order order = null;
        if (dto.getOrderId() != null) {
            order = orderRepository.findById(dto.getOrderId()).orElse(null);
        }

        validateAgainstOrderItemLimits(dto.getItems(), order, null);

        Warehouse warehouse = warehouseRepository.findById(dto.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));

        BigDecimal discount = dto.getDiscountAmount() != null ? dto.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal surcharge = dto.getSurchargeAmount() != null ? dto.getSurchargeAmount() : BigDecimal.ZERO;

        BigDecimal totalRefund = calculateTotalRefund(dto.getItems(), surcharge, discount);

        CustomerReturn cr = CustomerReturn.builder()
                .customer(customer)
                .order(order)
                .warehouse(warehouse)
                .returnDate(LocalDate.now())
                .status(DocumentStatus.DRAFT)
                .note(dto.getNote())
                .discountAmount(discount)
                .surchargeAmount(surcharge)
                .totalRefund(totalRefund)
                .createdBy(staff)
                .build();

        crRepository.saveAndFlush(cr);
        String generatedReturnNo = crRepository.findReturnNoById(cr.getId());
        cr.setReturnNo(generatedReturnNo);
        
        for (CustomerReturnRequestDTO.CustomerReturnItemRequestDTO itemDto : dto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            OrderItem orderItem = null;
            if (itemDto.getOrderItemId() != null) {
                orderItem = orderItemRepository.findById(itemDto.getOrderItemId())
                        .orElseThrow(() -> new RuntimeException("Order Item not found"));
                
                if (order != null && (orderItem.getOrder() == null || !orderItem.getOrder().getId().equals(order.getId()))) {
                    throw new RuntimeException("Order Item does not belong to the specified Order: " + dto.getOrderId());
                }
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

        return getCustomerReturnDetailById(cr.getId());
    }

    private Staff getAuthenticatedStaff() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new RuntimeException("Unauthenticated request");
        }
        return userDetails.getStaff();
    }

    @Override
    @Transactional
    public CustomerReturnDetailResponseDTO cancelDraftCustomerReturn(Long id) {
        CustomerReturn cr = getCustomerReturnEntityById(id);

        if (cr.getStatus() == DocumentStatus.POSTED) {
            throw new RuntimeException("Posted customer return cannot be cancelled");
        }
        if (cr.getStatus() == DocumentStatus.CANCELLED) {
            throw new RuntimeException("Customer return is already cancelled");
        }

        Staff currentStaff = getAuthenticatedStaff();
        boolean isAdmin = currentStaff.getRole() != null && currentStaff.getRole().equalsIgnoreCase("ADMIN");
        boolean isOwner = cr.getCreatedBy() != null && cr.getCreatedBy().getId() != null && cr.getCreatedBy().getId().equals(currentStaff.getId());

        if (!isAdmin && !isOwner) {
            throw new RuntimeException("You do not have permission to cancel this customer return");
        }

        cr.setStatus(DocumentStatus.CANCELLED);
        crRepository.save(cr);
        return getCustomerReturnDetailById(cr.getId());
    }

    @Override
    @Transactional
    public CustomerReturnDetailResponseDTO updateDraftCustomerReturn(Long id, CustomerReturnRequestDTO dto) {
        validateItemList(dto.getItems());

        CustomerReturn cr = getCustomerReturnEntityById(id);
        if (cr.getStatus() != DocumentStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT customer return can be updated");
        }

        Customer customer = customerRepository.findById(UUID.fromString(dto.getCustomerId()))
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Order order = null;
        if (dto.getOrderId() != null) {
            order = orderRepository.findById(dto.getOrderId()).orElse(null);
        }

        validateAgainstOrderItemLimits(dto.getItems(), order, id);

        Warehouse warehouse = warehouseRepository.findById(dto.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));

        BigDecimal discount = dto.getDiscountAmount() != null ? dto.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal surcharge = dto.getSurchargeAmount() != null ? dto.getSurchargeAmount() : BigDecimal.ZERO;

        cr.setCustomer(customer);
        cr.setOrder(order);
        cr.setWarehouse(warehouse);
        cr.setNote(dto.getNote());
        cr.setDiscountAmount(discount);
        cr.setSurchargeAmount(surcharge);
        cr.setTotalRefund(calculateTotalRefund(dto.getItems(), surcharge, discount));

        crItemRepository.deleteByCustomerReturnId(cr.getId());
        for (CustomerReturnRequestDTO.CustomerReturnItemRequestDTO itemDto : dto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            OrderItem orderItem = null;
            if (itemDto.getOrderItemId() != null) {
                orderItem = orderItemRepository.findById(itemDto.getOrderItemId())
                        .orElseThrow(() -> new RuntimeException("Order Item not found"));
                
                if (order != null && (orderItem.getOrder() == null || !orderItem.getOrder().getId().equals(order.getId()))) {
                    throw new RuntimeException("Order Item does not belong to the specified Order: " + dto.getOrderId());
                }
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

        crRepository.save(cr);
        return getCustomerReturnDetailById(cr.getId());
    }

    @Override
    @Transactional
    public CustomerReturnDetailResponseDTO completeCustomerReturn(Long id) {
        CustomerReturn cr = getCustomerReturnEntityById(id);

        if (cr.getStatus() == DocumentStatus.CANCELLED) {
            throw new RuntimeException("Cancelled return cannot be completed");
        }
        if (cr.getStatus() == DocumentStatus.POSTED) {
            throw new RuntimeException("Return already completed");
        }

        List<CustomerReturnItem> items = crItemRepository.findByCustomerReturnId(cr.getId());

        for (CustomerReturnItem item : items) {
            if (cr.getOrder() != null && item.getOrderItem() == null) {
                throw new RuntimeException("Order item is required when customer return references an order");
            }

            OrderItem orderItem = item.getOrderItem();
            if (orderItem == null) {
                continue;
            }

            if (orderItem.getProduct() == null || !orderItem.getProduct().getId().equals(item.getProduct().getId())) {
                throw new RuntimeException("Returned product does not match the referenced order item");
            }

            Integer postedQty = crItemRepository.sumQtyByOrderItemIdAndReturnStatus(orderItem.getId(), DocumentStatus.POSTED);
            int alreadyReturnedQty = postedQty == null ? 0 : postedQty;
            int maxQty = orderItem.getQty() == null ? 0 : orderItem.getQty();
            int requestedQty = item.getQty() == null ? 0 : item.getQty();

            if (alreadyReturnedQty + requestedQty > maxQty) {
                throw new RuntimeException("Returned quantity exceeds sold quantity for order item: " + orderItem.getId());
            }

            BigDecimal postedRefund = crItemRepository.sumRefundByOrderItemIdAndReturnStatus(orderItem.getId(), DocumentStatus.POSTED);
            BigDecimal alreadyRefunded = postedRefund == null ? BigDecimal.ZERO : postedRefund;
            BigDecimal maxRefund = orderItem.getLineRevenue() == null ? BigDecimal.ZERO : orderItem.getLineRevenue();
            BigDecimal requestedRefund = item.getRefundAmount() == null ? BigDecimal.ZERO : item.getRefundAmount();

            if (alreadyRefunded.add(requestedRefund).compareTo(maxRefund) > 0) {
                throw new RuntimeException("Refund amount exceeds original order item value: " + orderItem.getId());
            }
        }

        cr.setStatus(DocumentStatus.POSTED);
        crRepository.save(cr);

        for (CustomerReturnItem item : items) {
            Product product = item.getProduct();

            InventoryMovement act = InventoryMovement.builder()
                    .product(product)
                    .warehouse(cr.getWarehouse())
                    .movementType(IUH.KLTN.LvsH.enums.InventoryMovementType.RETURN_IN)
                    .qty(item.getQty())
                    .refTable("customer_returns")
                    .refId(cr.getReturnNo())
                    .createdBy(cr.getCreatedBy())
                    .build();

            movementRepository.save(act);
        }
        return getCustomerReturnDetailById(cr.getId());
    }

    private void validateItemList(List<CustomerReturnRequestDTO.CustomerReturnItemRequestDTO> items) {
        if (items == null || items.isEmpty()) {
            throw new RuntimeException("Customer return items are required");
        }
        for (CustomerReturnRequestDTO.CustomerReturnItemRequestDTO itemDto : items) {
            if (itemDto.getQty() == null || itemDto.getQty() <= 0) {
                throw new RuntimeException("qty must be greater than 0");
            }
            if (itemDto.getRefundAmount() == null || itemDto.getRefundAmount().compareTo(BigDecimal.ZERO) < 0) {
                throw new RuntimeException("refundAmount must be >= 0");
            }
        }
    }

    private BigDecimal calculateTotalRefund(List<CustomerReturnRequestDTO.CustomerReturnItemRequestDTO> items, BigDecimal surcharge, BigDecimal discount) {
        BigDecimal totalRefund = BigDecimal.ZERO;
        for (CustomerReturnRequestDTO.CustomerReturnItemRequestDTO itemDto : items) {
            totalRefund = totalRefund.add(itemDto.getRefundAmount());
        }
        
        BigDecimal payable = totalRefund.add(surcharge).subtract(discount);
        if (payable.compareTo(BigDecimal.ZERO) < 0) {
            payable = BigDecimal.ZERO;
        }
        return payable;
    }

    private void validateAgainstOrderItemLimits(List<CustomerReturnRequestDTO.CustomerReturnItemRequestDTO> items,
                                                Order order,
                                                Long excludedReturnId) {
        for (CustomerReturnRequestDTO.CustomerReturnItemRequestDTO itemDto : items) {
            if (itemDto.getOrderItemId() == null) {
                continue;
            }

            OrderItem orderItem = orderItemRepository.findById(itemDto.getOrderItemId())
                    .orElseThrow(() -> new RuntimeException("Order Item not found"));

            if (order != null && (orderItem.getOrder() == null || !orderItem.getOrder().getId().equals(order.getId()))) {
                throw new RuntimeException("Order Item does not belong to the specified Order: " + order.getId());
            }

            Integer postedQty = excludedReturnId == null
                    ? crItemRepository.sumQtyByOrderItemIdAndReturnStatus(orderItem.getId(), DocumentStatus.POSTED)
                    : crItemRepository.sumQtyByOrderItemIdAndReturnStatusExcludingReturnId(orderItem.getId(), DocumentStatus.POSTED, excludedReturnId);
            Integer pendingQty = excludedReturnId == null
                    ? crItemRepository.sumQtyByOrderItemIdAndReturnStatus(orderItem.getId(), DocumentStatus.DRAFT)
                    : crItemRepository.sumQtyByOrderItemIdAndReturnStatusExcludingReturnId(orderItem.getId(), DocumentStatus.DRAFT, excludedReturnId);

            int alreadyPosted = postedQty == null ? 0 : postedQty;
            int alreadyPending = pendingQty == null ? 0 : pendingQty;
            int maxQty = orderItem.getQty() == null ? 0 : orderItem.getQty();
            int requestedQty = itemDto.getQty() == null ? 0 : itemDto.getQty();

            if (alreadyPosted + alreadyPending + requestedQty > maxQty) {
                throw new RuntimeException("Returned quantity exceeds available quantity (sold - pending - posted) for order item: " + orderItem.getId());
            }

            BigDecimal postedRefund = excludedReturnId == null
                    ? crItemRepository.sumRefundByOrderItemIdAndReturnStatus(orderItem.getId(), DocumentStatus.POSTED)
                    : crItemRepository.sumRefundByOrderItemIdAndReturnStatusExcludingReturnId(orderItem.getId(), DocumentStatus.POSTED, excludedReturnId);
            BigDecimal pendingRefund = excludedReturnId == null
                    ? crItemRepository.sumRefundByOrderItemIdAndReturnStatus(orderItem.getId(), DocumentStatus.DRAFT)
                    : crItemRepository.sumRefundByOrderItemIdAndReturnStatusExcludingReturnId(orderItem.getId(), DocumentStatus.DRAFT, excludedReturnId);

            BigDecimal alreadyRefunded = postedRefund == null ? BigDecimal.ZERO : postedRefund;
            BigDecimal pendingRefunded = pendingRefund == null ? BigDecimal.ZERO : pendingRefund;
            BigDecimal maxRefund = orderItem.getLineRevenue() == null ? BigDecimal.ZERO : orderItem.getLineRevenue();
            BigDecimal requestedRefund = itemDto.getRefundAmount() == null ? BigDecimal.ZERO : itemDto.getRefundAmount();

            if (alreadyRefunded.add(pendingRefunded).add(requestedRefund).compareTo(maxRefund) > 0) {
                throw new RuntimeException("Refund amount exceeds available amount (line revenue - pending - posted) for order item: " + orderItem.getId());
            }
        }
    }
}
