package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.dto.purchase_order.PurchaseOrderDetailResponseDTO;
import IUH.KLTN.LvsH.dto.purchase_order.PurchaseOrderListResponseDTO;
import IUH.KLTN.LvsH.dto.purchase_order.PurchaseOrderRequestDTO;
import IUH.KLTN.LvsH.dto.purchase_order.PurchaseOrderSearchCriteria;
import IUH.KLTN.LvsH.entity.Product;
import IUH.KLTN.LvsH.entity.PurchaseOrder;
import IUH.KLTN.LvsH.entity.PurchaseOrderItem;
import IUH.KLTN.LvsH.entity.Staff;
import IUH.KLTN.LvsH.entity.Supplier;
import IUH.KLTN.LvsH.entity.SupplierProduct;
import IUH.KLTN.LvsH.entity.Warehouse;
import IUH.KLTN.LvsH.enums.DocumentStatus;
import IUH.KLTN.LvsH.enums.PurchaseOrderClosedReason;
import IUH.KLTN.LvsH.enums.PurchaseOrderReceiptProgress;
import IUH.KLTN.LvsH.repository.GoodsReceiptItemRepository;
import IUH.KLTN.LvsH.repository.ProductRepository;
import IUH.KLTN.LvsH.repository.PurchaseOrderItemRepository;
import IUH.KLTN.LvsH.repository.PurchaseOrderRepository;
import IUH.KLTN.LvsH.repository.SupplierProductRepository;
import IUH.KLTN.LvsH.repository.SupplierRepository;
import IUH.KLTN.LvsH.repository.WarehouseRepository;
import IUH.KLTN.LvsH.repository.specification.PurchaseOrderSpecification;
import IUH.KLTN.LvsH.security.CustomUserDetails;
import IUH.KLTN.LvsH.service.PurchaseOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PurchaseOrderServiceImpl implements PurchaseOrderService {

    // Ngưỡng cảnh báo biến động giá: 20%
    private static final BigDecimal PRICE_DEVIATION_THRESHOLD = new BigDecimal("20");

    private final PurchaseOrderRepository poRepository;
    private final PurchaseOrderItemRepository poItemRepository;
    private final GoodsReceiptItemRepository grItemRepository;
    private final SupplierRepository supplierRepository;
    private final SupplierProductRepository supplierProductRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;

    @Override
    public Page<PurchaseOrderListResponseDTO> getAllPurchaseOrders(PurchaseOrderSearchCriteria criteria, Pageable pageable) {
        Page<PurchaseOrder> page = poRepository.findAll(PurchaseOrderSpecification.withCriteria(criteria), pageable);
        return page.map(po -> PurchaseOrderListResponseDTO.builder()
                .id(po.getId())
                .poNo(po.getPoNo())
                .supplierName(po.getSupplier() != null ? po.getSupplier().getName() : null)
                .warehouseName(po.getWarehouse() != null ? po.getWarehouse().getName() : null)
                .orderDate(po.getOrderDate())
                .expectedDate(po.getExpectedDate())
                .status(po.getStatus().name())
                .receiptProgress(po.getReceiptProgress().name())
                .totalAmountPayable(po.getTotalAmountPayable())
                .createdBy(po.getCreatedBy().getFullName())
                .createdAt(po.getCreatedAt())
                .closedAt(po.getClosedAt())
                .closedReason(po.getClosedReason() != null ? po.getClosedReason().name() : null)
                .allowOverReceipt(Boolean.TRUE.equals(po.getAllowOverReceipt()))
                .note(po.getNote())
                .build());
    }

    private PurchaseOrder getPurchaseOrderEntityById(Long id) {
        return poRepository.findById(id).orElseThrow(() -> new RuntimeException("Purchase Order not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseOrderDetailResponseDTO getPurchaseOrderDetailById(Long id) {
        return toDetailResponseDTO(getPurchaseOrderEntityById(id));
    }

    @Override
    @Transactional
    public PurchaseOrderDetailResponseDTO createPurchaseOrder(PurchaseOrderRequestDTO dto) {
        validateItemList(dto.getItems());

        Supplier supplier = supplierRepository.findById(dto.getSupplierId())
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        Staff staff = getAuthenticatedStaff();

        Warehouse warehouse = dto.getWarehouseId() != null
                ? warehouseRepository.findById(dto.getWarehouseId()).orElse(null)
                : null;

        // Validate SP thuộc NCC + thu thập cảnh báo giá
        List<String> warnings = validateSupplierProductsAndCollectWarnings(dto.getSupplierId(), dto.getItems());

        BigDecimal discount = dto.getDiscountAmount() != null ? dto.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal surcharge = dto.getSurchargeAmount() != null ? dto.getSurchargeAmount() : BigDecimal.ZERO;

        Totals totals = calculateTotals(dto.getItems(), surcharge, discount);

        PurchaseOrder po = PurchaseOrder.builder()
                .supplier(supplier)
                .warehouse(warehouse)
                .orderDate(LocalDate.now())
                .expectedDate(dto.getExpectedDate())
                .status(DocumentStatus.DRAFT)
                .receiptProgress(PurchaseOrderReceiptProgress.NOT_RECEIVED)
                .allowOverReceipt(Boolean.TRUE.equals(dto.getAllowOverReceipt()))
                .note(dto.getNote())
                .discountAmount(discount)
                .surchargeAmount(surcharge)
                .totalAmount(totals.totalAmount)
                .totalVat(totals.totalVat)
                .totalAmountPayable(totals.totalAmountPayable)
                .createdBy(staff)
                .build();

        poRepository.saveAndFlush(po);
        String generatedPoNo = poRepository.findPoNoById(po.getId());
        po.setPoNo(generatedPoNo);

        savePurchaseOrderItems(po, dto.getItems());
        PurchaseOrderDetailResponseDTO response = toDetailResponseDTO(po);
        response.setWarnings(warnings.isEmpty() ? null : warnings);
        return response;
    }

    @Override
    @Transactional
    public PurchaseOrderDetailResponseDTO updateDraftPurchaseOrder(Long id, PurchaseOrderRequestDTO dto) {
        validateItemList(dto.getItems());

        PurchaseOrder po = getPurchaseOrderEntityById(id);
        if (po.getStatus() != DocumentStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT purchase order can be updated");
        }

        Supplier supplier = supplierRepository.findById(dto.getSupplierId())
                .orElseThrow(() -> new RuntimeException("Supplier not found"));

        Warehouse warehouse = dto.getWarehouseId() != null
                ? warehouseRepository.findById(dto.getWarehouseId()).orElse(null)
                : null;

        // Validate SP thuộc NCC + thu thập cảnh báo giá
        List<String> warnings = validateSupplierProductsAndCollectWarnings(dto.getSupplierId(), dto.getItems());

        BigDecimal discount = dto.getDiscountAmount() != null ? dto.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal surcharge = dto.getSurchargeAmount() != null ? dto.getSurchargeAmount() : BigDecimal.ZERO;

        Totals totals = calculateTotals(dto.getItems(), surcharge, discount);

        po.setSupplier(supplier);
        po.setWarehouse(warehouse);
        po.setExpectedDate(dto.getExpectedDate());
        po.setAllowOverReceipt(Boolean.TRUE.equals(dto.getAllowOverReceipt()));
        po.setNote(dto.getNote());
        po.setDiscountAmount(discount);
        po.setSurchargeAmount(surcharge);
        po.setTotalAmount(totals.totalAmount);
        po.setTotalVat(totals.totalVat);
        po.setTotalAmountPayable(totals.totalAmountPayable);
        po.setReceiptProgress(PurchaseOrderReceiptProgress.NOT_RECEIVED);
        po.setClosedAt(null);
        po.setClosedReason(null);

        poItemRepository.deleteByPurchaseOrderId(po.getId());
        savePurchaseOrderItems(po, dto.getItems());

        poRepository.save(po);
        PurchaseOrderDetailResponseDTO response = toDetailResponseDTO(po);
        response.setWarnings(warnings.isEmpty() ? null : warnings);
        return response;
    }

    @Override
    @Transactional
    public PurchaseOrderDetailResponseDTO updateStatus(Long id, String newStatus) {
        PurchaseOrder po = getPurchaseOrderEntityById(id);
        DocumentStatus requestedStatus;
        try {
            requestedStatus = DocumentStatus.valueOf(newStatus.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Invalid status: " + newStatus);
        }

        DocumentStatus currentStatus = po.getStatus();
        if (currentStatus == DocumentStatus.POSTED || currentStatus == DocumentStatus.CANCELLED) {
            throw new RuntimeException("Cannot change status from " + currentStatus);
        }
        if (requestedStatus == DocumentStatus.DRAFT) {
            throw new RuntimeException("DRAFT is not a valid target status");
        }

        po.setStatus(requestedStatus);
        if (requestedStatus == DocumentStatus.CANCELLED) {
            po.setClosedAt(null);
            po.setClosedReason(null);
            po.setReceiptProgress(PurchaseOrderReceiptProgress.NOT_RECEIVED);
        }
        poRepository.save(po);
        return toDetailResponseDTO(po);
    }

    @Override
    @Transactional
    public PurchaseOrderDetailResponseDTO closePurchaseOrder(Long id, PurchaseOrderClosedReason reason) {
        PurchaseOrder po = getPurchaseOrderEntityById(id);
        if (po.getStatus() != DocumentStatus.POSTED) {
            throw new RuntimeException("Only POSTED purchase order can be closed");
        }
        if (po.getClosedAt() != null) {
            throw new RuntimeException("Purchase order is already closed");
        }
        if (reason == null || reason == PurchaseOrderClosedReason.FULLY_RECEIVED) {
            throw new RuntimeException("Manual close requires a non-FULLY_RECEIVED reason");
        }

        po.setClosedAt(LocalDateTime.now());
        po.setClosedReason(reason);
        poRepository.save(po);
        return toDetailResponseDTO(po);
    }

    private Staff getAuthenticatedStaff() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new RuntimeException("Unauthenticated request");
        }
        return userDetails.getStaff();
    }

    private PurchaseOrderDetailResponseDTO toDetailResponseDTO(PurchaseOrder po) {
        List<PurchaseOrderItem> items = poItemRepository.findByPurchaseOrderId(po.getId());
        Map<Long, Integer> postedReceivedByPoItemId = getPostedReceivedQtyByPurchaseOrderId(po.getId());

        // Lấy supplierId để tra giá tham chiếu
        UUID supplierId = po.getSupplier() != null ? po.getSupplier().getId() : null;

        List<PurchaseOrderDetailResponseDTO.PurchaseOrderItemResponseDTO> itemDTOs = items.stream()
                .map(item -> {
                    int receivedQty = postedReceivedByPoItemId.getOrDefault(item.getId(), 0);
                    int orderedQty = item.getOrderedQty() == null ? 0 : item.getOrderedQty();
                    int remainingQty = Math.max(orderedQty - receivedQty, 0);

                    // Tra giá tham chiếu từ bảng giá NCC
                    BigDecimal standardPrice = null;
                    if (supplierId != null) {
                        standardPrice = supplierProductRepository
                                .findBySupplierIdAndProductId(supplierId, item.getProduct().getId())
                                .map(SupplierProduct::getStandardPrice)
                                .orElse(null);
                    }

                    return PurchaseOrderDetailResponseDTO.PurchaseOrderItemResponseDTO.builder()
                            .id(item.getId())
                            .productId(item.getProduct().getId())
                            .productSku(item.getProduct().getSku())
                            .productName(item.getProduct().getName())
                            .orderedQty(orderedQty)
                            .receivedQty(receivedQty)
                            .remainingQty(remainingQty)
                            .expectedUnitCost(item.getExpectedUnitCost())
                            .standardPrice(standardPrice)
                            .vatRate(item.getProduct().getVatRate())
                            .lineTotal(item.getLineTotal())
                            .build();
                })
                .collect(Collectors.toList());

        return PurchaseOrderDetailResponseDTO.builder()
                .id(po.getId())
                .poNo(po.getPoNo())
                .supplierId(supplierId)
                .supplierName(po.getSupplier() != null ? po.getSupplier().getName() : null)
                .warehouseId(po.getWarehouse() != null ? po.getWarehouse().getId() : null)
                .warehouseName(po.getWarehouse() != null ? po.getWarehouse().getName() : null)
                .orderDate(po.getOrderDate())
                .expectedDate(po.getExpectedDate())
                .status(po.getStatus().name())
                .receiptProgress(po.getReceiptProgress().name())
                .closedAt(po.getClosedAt())
                .closedReason(po.getClosedReason() != null ? po.getClosedReason().name() : null)
                .allowOverReceipt(Boolean.TRUE.equals(po.getAllowOverReceipt()))
                .note(po.getNote())
                .totalAmount(po.getTotalAmount())
                .totalVat(po.getTotalVat())
                .discountAmount(po.getDiscountAmount())
                .surchargeAmount(po.getSurchargeAmount())
                .totalAmountPayable(po.getTotalAmountPayable())
                .createdBy(po.getCreatedBy().getFullName())
                .createdAt(po.getCreatedAt())
                .items(itemDTOs)
                .build();
    }

    private Map<Long, Integer> getPostedReceivedQtyByPurchaseOrderId(Long purchaseOrderId) {
        return grItemRepository.sumReceivedQtyByPurchaseOrderIdAndReceiptStatus(purchaseOrderId, DocumentStatus.POSTED)
                .stream()
                .collect(Collectors.toMap(
                        GoodsReceiptItemRepository.PoItemReceivedQtyProjection::getPoItemId,
                        projection -> projection.getReceivedQty() == null ? 0 : projection.getReceivedQty()
                ));
    }

    private void savePurchaseOrderItems(PurchaseOrder po, List<PurchaseOrderRequestDTO.PurchaseOrderItemRequestDTO> itemDtos) {
        for (PurchaseOrderRequestDTO.PurchaseOrderItemRequestDTO itemDto : itemDtos) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            BigDecimal lineTotal = itemDto.getExpectedUnitCost().multiply(BigDecimal.valueOf(itemDto.getOrderedQty()));

            PurchaseOrderItem item = PurchaseOrderItem.builder()
                    .purchaseOrder(po)
                    .product(product)
                    .orderedQty(itemDto.getOrderedQty())
                    .expectedUnitCost(itemDto.getExpectedUnitCost())
                    .lineTotal(lineTotal)
                    .build();

            poItemRepository.save(item);
        }
    }

    private Totals calculateTotals(List<PurchaseOrderRequestDTO.PurchaseOrderItemRequestDTO> items, BigDecimal surcharge, BigDecimal discount) {
        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal totalVat = BigDecimal.ZERO;

        for (PurchaseOrderRequestDTO.PurchaseOrderItemRequestDTO itemDto : items) {
            if (itemDto.getOrderedQty() == null || itemDto.getOrderedQty() <= 0) {
                throw new RuntimeException("orderedQty must be greater than 0");
            }
            if (itemDto.getExpectedUnitCost() == null || itemDto.getExpectedUnitCost().compareTo(BigDecimal.ZERO) < 0) {
                throw new RuntimeException("expectedUnitCost must be >= 0");
            }

            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            BigDecimal lineTotal = itemDto.getExpectedUnitCost().multiply(BigDecimal.valueOf(itemDto.getOrderedQty()));
            BigDecimal vatRate = product.getVatRate() == null ? BigDecimal.ZERO : product.getVatRate();
            BigDecimal lineVat = lineTotal.multiply(vatRate).divide(BigDecimal.valueOf(100));

            totalAmount = totalAmount.add(lineTotal);
            totalVat = totalVat.add(lineVat);
        }

        BigDecimal payable = totalAmount.add(totalVat).add(surcharge).subtract(discount);
        if (payable.compareTo(BigDecimal.ZERO) < 0) {
            payable = BigDecimal.ZERO;
        }

        return new Totals(totalAmount, totalVat, payable);
    }

    private void validateItemList(List<PurchaseOrderRequestDTO.PurchaseOrderItemRequestDTO> items) {
        if (items == null || items.isEmpty()) {
            throw new RuntimeException("Purchase order items are required");
        }
    }

    /**
     * Validate từng SP phải thuộc bảng giá NCC (chặn cứng).
     * Nếu giá nhập lệch > PRICE_DEVIATION_THRESHOLD so với standard_price → thêm warning.
     */
    private List<String> validateSupplierProductsAndCollectWarnings(
            UUID supplierId,
            List<PurchaseOrderRequestDTO.PurchaseOrderItemRequestDTO> items) {

        List<String> warnings = new ArrayList<>();

        for (PurchaseOrderRequestDTO.PurchaseOrderItemRequestDTO itemDto : items) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại: " + itemDto.getProductId()));

            // Chặn cứng: SP phải thuộc bảng giá NCC
            SupplierProduct sp = supplierProductRepository
                    .findBySupplierIdAndProductIdAndIsActiveTrue(supplierId, itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException(
                            "Sản phẩm '" + product.getName() + "' (" + product.getSku()
                            + ") không thuộc bảng giá của nhà cung cấp này. "
                            + "Vui lòng thêm sản phẩm vào bảng giá NCC trước."));

            // Cảnh báo biến động giá
            BigDecimal standardPrice = sp.getStandardPrice();
            BigDecimal enteredPrice = itemDto.getExpectedUnitCost();

            if (standardPrice != null && standardPrice.compareTo(BigDecimal.ZERO) > 0 && enteredPrice != null) {
                BigDecimal deviation = enteredPrice.subtract(standardPrice)
                        .abs()
                        .multiply(new BigDecimal("100"))
                        .divide(standardPrice, 2, RoundingMode.HALF_UP);

                if (deviation.compareTo(PRICE_DEVIATION_THRESHOLD) > 0) {
                    warnings.add(String.format(
                            "Giá nhập SP '%s' (%s) là %s, lệch %.1f%% so với giá tham chiếu %s",
                            product.getName(), product.getSku(),
                            enteredPrice.toPlainString(), deviation,
                            standardPrice.toPlainString()));
                }
            }
        }

        return warnings;
    }

    private static class Totals {
        private final BigDecimal totalAmount;
        private final BigDecimal totalVat;
        private final BigDecimal totalAmountPayable;

        private Totals(BigDecimal totalAmount, BigDecimal totalVat, BigDecimal totalAmountPayable) {
            this.totalAmount = totalAmount;
            this.totalVat = totalVat;
            this.totalAmountPayable = totalAmountPayable;
        }
    }
}
