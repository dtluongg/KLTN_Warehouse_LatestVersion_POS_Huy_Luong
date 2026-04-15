package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.dto.goods_receipt.GoodsReceiptDetailResponseDTO;
import IUH.KLTN.LvsH.dto.goods_receipt.GoodsReceiptListResponseDTO;
import IUH.KLTN.LvsH.dto.goods_receipt.GoodsReceiptRequestDTO;
import IUH.KLTN.LvsH.dto.goods_receipt.GoodsReceiptSearchCriteria;
import IUH.KLTN.LvsH.entity.GoodsReceipt;
import IUH.KLTN.LvsH.entity.GoodsReceiptItem;
import IUH.KLTN.LvsH.entity.InventoryMovement;
import IUH.KLTN.LvsH.entity.Product;
import IUH.KLTN.LvsH.entity.PurchaseOrder;
import IUH.KLTN.LvsH.entity.PurchaseOrderItem;
import IUH.KLTN.LvsH.entity.Staff;
import IUH.KLTN.LvsH.entity.Supplier;
import IUH.KLTN.LvsH.entity.Warehouse;
import IUH.KLTN.LvsH.enums.DocumentStatus;
import IUH.KLTN.LvsH.enums.InventoryMovementType;
import IUH.KLTN.LvsH.enums.PurchaseOrderClosedReason;
import IUH.KLTN.LvsH.enums.PurchaseOrderReceiptProgress;
import IUH.KLTN.LvsH.repository.GoodsReceiptItemRepository;
import IUH.KLTN.LvsH.repository.GoodsReceiptRepository;
import IUH.KLTN.LvsH.repository.InventoryMovementRepository;
import IUH.KLTN.LvsH.repository.ProductRepository;
import IUH.KLTN.LvsH.repository.PurchaseOrderItemRepository;
import IUH.KLTN.LvsH.repository.PurchaseOrderRepository;
import IUH.KLTN.LvsH.repository.SupplierRepository;
import IUH.KLTN.LvsH.repository.WarehouseRepository;
import IUH.KLTN.LvsH.repository.specification.GoodsReceiptSpecification;
import IUH.KLTN.LvsH.security.CustomUserDetails;
import IUH.KLTN.LvsH.service.GoodsReceiptService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GoodsReceiptServiceImpl implements GoodsReceiptService {

    private final GoodsReceiptRepository grRepository;
    private final GoodsReceiptItemRepository grItemRepository;
    private final PurchaseOrderRepository poRepository;
    private final PurchaseOrderItemRepository poItemRepository;
    private final SupplierRepository supplierRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final InventoryMovementRepository inventoryMovementRepository;

    @Override
    public Page<GoodsReceiptListResponseDTO> getAllGoodsReceipts(GoodsReceiptSearchCriteria criteria, Pageable pageable) {
        Specification<GoodsReceipt> spec = GoodsReceiptSpecification.withCriteria(criteria);
        Page<GoodsReceipt> page = grRepository.findAll(spec, pageable);
        return page.map(gr -> GoodsReceiptListResponseDTO.builder()
                .id(gr.getId())
                .grNo(gr.getGrNo())
                .poNo(gr.getPurchaseOrder() != null ? gr.getPurchaseOrder().getPoNo() : null)
                .supplierName(gr.getSupplier() != null ? gr.getSupplier().getName() : null)
                .warehouseName(gr.getWarehouse() != null ? gr.getWarehouse().getName() : null)
                .createdByName(gr.getCreatedBy() != null ? gr.getCreatedBy().getFullName() : null)
                .receiptDate(gr.getReceiptDate())
                .status(gr.getStatus())
                .totalAmountPayable(gr.getTotalAmountPayable())
                .createdAt(gr.getCreatedAt())
                .note(gr.getNote())
                .build());
    }

    @Override
    public GoodsReceipt getGoodsReceiptById(Long id) {
        return grRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goods Receipt not found"));
    }

    @Override
    public GoodsReceiptDetailResponseDTO getGoodsReceiptDetailById(Long id) {
        return toDetailResponseDTO(getGoodsReceiptById(id));
    }

    @Override
    @Transactional
    public GoodsReceiptDetailResponseDTO createGoodsReceipt(GoodsReceiptRequestDTO dto) {
        PurchaseOrder po = poRepository.findById(dto.getPoId())
                .orElseThrow(() -> new RuntimeException("PO not found"));
        validatePurchaseOrderForReceiving(po);

        Supplier supplier = supplierRepository.findById(UUID.fromString(dto.getSupplierId()))
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        Warehouse warehouse = warehouseRepository.findById(dto.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));
        Staff staff = getAuthenticatedStaff();

        validateItemList(dto.getItems());
        validateAgainstPurchaseOrderItemLimits(dto.getItems(), po, null, true);

        BigDecimal discount = dto.getDiscountAmount() != null ? dto.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal surcharge = dto.getSurchargeAmount() != null ? dto.getSurchargeAmount() : BigDecimal.ZERO;

        Totals totals = calculateTotals(dto.getItems(), surcharge, discount);

        GoodsReceipt gr = GoodsReceipt.builder()
                .purchaseOrder(po)
                .supplier(supplier)
                .warehouse(warehouse)
                .receiptDate(LocalDate.now())
                .status(DocumentStatus.DRAFT)
                .note(dto.getNote())
                .discountAmount(discount)
                .surchargeAmount(surcharge)
                .totalAmount(totals.totalAmount)
                .totalVat(totals.totalVat)
                .totalAmountPayable(totals.totalAmountPayable)
                .createdBy(staff)
                .build();

        grRepository.saveAndFlush(gr);
        String generatedGrNo = grRepository.findGrNoById(gr.getId());
        gr.setGrNo(generatedGrNo);

        saveGoodsReceiptItems(gr, po, dto.getItems());
        return toDetailResponseDTO(gr);
    }

    @Override
    @Transactional
    public GoodsReceiptDetailResponseDTO updateDraftGoodsReceipt(Long id, GoodsReceiptRequestDTO dto) {
        validateItemList(dto.getItems());

        GoodsReceipt gr = getGoodsReceiptById(id);
        if (gr.getStatus() != DocumentStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT goods receipt can be updated");
        }

        PurchaseOrder po = poRepository.findById(dto.getPoId())
                .orElseThrow(() -> new RuntimeException("PO not found"));
        validatePurchaseOrderForReceiving(po);

        Supplier supplier = supplierRepository.findById(UUID.fromString(dto.getSupplierId()))
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        Warehouse warehouse = warehouseRepository.findById(dto.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));

        validateAgainstPurchaseOrderItemLimits(dto.getItems(), po, gr.getId(), true);

        BigDecimal discount = dto.getDiscountAmount() != null ? dto.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal surcharge = dto.getSurchargeAmount() != null ? dto.getSurchargeAmount() : BigDecimal.ZERO;

        Totals totals = calculateTotals(dto.getItems(), surcharge, discount);

        gr.setPurchaseOrder(po);
        gr.setSupplier(supplier);
        gr.setWarehouse(warehouse);
        gr.setNote(dto.getNote());
        gr.setDiscountAmount(discount);
        gr.setSurchargeAmount(surcharge);
        gr.setTotalAmount(totals.totalAmount);
        gr.setTotalVat(totals.totalVat);
        gr.setTotalAmountPayable(totals.totalAmountPayable);

        grItemRepository.deleteByGoodsReceiptId(gr.getId());
        saveGoodsReceiptItems(gr, po, dto.getItems());

        return toDetailResponseDTO(grRepository.save(gr));
    }

    @Override
    @Transactional
    public GoodsReceiptDetailResponseDTO completeGoodsReceipt(Long id) {
        GoodsReceipt gr = getGoodsReceiptById(id);

        if (gr.getStatus() == DocumentStatus.CANCELLED) {
            throw new RuntimeException("Cancelled goods receipt cannot be completed.");
        }
        if (gr.getStatus() == DocumentStatus.POSTED) {
            throw new RuntimeException("Goods receipt is already completed.");
        }

        PurchaseOrder po = gr.getPurchaseOrder();
        validatePurchaseOrderForReceiving(po);

        List<GoodsReceiptItem> items = grItemRepository.findByGoodsReceiptId(gr.getId());
        validatePostedLimitsOnComplete(items, po, gr.getId());

        gr.setStatus(DocumentStatus.POSTED);
        grRepository.save(gr);

        for (GoodsReceiptItem item : items) {
            Product product = item.getProduct();

            BigDecimal oldQty = BigDecimal.valueOf(productRepository.calculateGlobalOnHandByProductId(product.getId()));
            BigDecimal oldAvgCost = product.getAvgCost();

            BigDecimal receivedQty = BigDecimal.valueOf(item.getReceivedQty());
            BigDecimal incomingUnitCost = item.getUnitCost();

            BigDecimal newTotalValue = oldQty.multiply(oldAvgCost).add(receivedQty.multiply(incomingUnitCost));
            BigDecimal newTotalQty = oldQty.add(receivedQty);

            BigDecimal newAvgCost = oldAvgCost;
            if (newTotalQty.compareTo(BigDecimal.ZERO) > 0) {
                newAvgCost = newTotalValue.divide(newTotalQty, 2, RoundingMode.HALF_UP);
            }

            product.setAvgCost(newAvgCost);
            product.setLastPurchaseCost(incomingUnitCost);
            productRepository.save(product);

            InventoryMovement movement = InventoryMovement.builder()
                    .product(product)
                    .warehouse(gr.getWarehouse())
                    .movementType(InventoryMovementType.PURCHASE_IN)
                    .qty(item.getReceivedQty())
                    .refTable("goods_receipts")
                    .refId(gr.getGrNo())
                    .createdBy(gr.getCreatedBy())
                    .build();

            inventoryMovementRepository.save(movement);
        }

        syncPurchaseOrderReceiptState(po);
        return toDetailResponseDTO(gr);
    }

    @Override
    @Transactional
    public GoodsReceiptDetailResponseDTO cancelGoodsReceipt(Long id) {
        GoodsReceipt gr = getGoodsReceiptById(id);
        if (gr.getStatus() == DocumentStatus.POSTED) {
            throw new RuntimeException("Cannot cancel a completed goods receipt.");
        }
        if (gr.getStatus() == DocumentStatus.CANCELLED) {
            throw new RuntimeException("Goods receipt is already cancelled.");
        }

        gr.setStatus(DocumentStatus.CANCELLED);
        grRepository.save(gr);
        return toDetailResponseDTO(gr);
    }

    private Staff getAuthenticatedStaff() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new RuntimeException("Unauthenticated request");
        }
        return userDetails.getStaff();
    }

    private void validatePurchaseOrderForReceiving(PurchaseOrder po) {
        if (po.getStatus() != DocumentStatus.POSTED) {
            throw new RuntimeException("Only POSTED purchase order can be used to receive goods");
        }
        if (po.getClosedAt() != null) {
            throw new RuntimeException("Purchase order is already closed");
        }
    }

    private void saveGoodsReceiptItems(GoodsReceipt gr,
                                       PurchaseOrder po,
                                       List<GoodsReceiptRequestDTO.GrItemRequestDTO> itemDtos) {
        for (GoodsReceiptRequestDTO.GrItemRequestDTO itemDto : itemDtos) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            PurchaseOrderItem poItem = poItemRepository.findById(itemDto.getPoItemId())
                    .orElseThrow(() -> new RuntimeException("Purchase Order Item not found"));

            if (poItem.getPurchaseOrder() == null || !poItem.getPurchaseOrder().getId().equals(po.getId())) {
                throw new RuntimeException("Purchase Order Item does not belong to the specified Purchase Order: " + po.getId());
            }
            if (poItem.getProduct() == null || !poItem.getProduct().getId().equals(itemDto.getProductId())) {
                throw new RuntimeException("Goods receipt product does not match the referenced purchase order item: " + itemDto.getPoItemId());
            }

            BigDecimal lineTotal = itemDto.getUnitCost().multiply(BigDecimal.valueOf(itemDto.getReceivedQty()));

            GoodsReceiptItem item = GoodsReceiptItem.builder()
                    .goodsReceipt(gr)
                    .purchaseOrderItem(poItem)
                    .product(product)
                    .receivedQty(itemDto.getReceivedQty())
                    .unitCost(itemDto.getUnitCost())
                    .lineTotal(lineTotal)
                    .build();

            grItemRepository.save(item);
        }
    }

    private void validateItemList(List<GoodsReceiptRequestDTO.GrItemRequestDTO> items) {
        if (items == null || items.isEmpty()) {
            throw new RuntimeException("Goods receipt items are required");
        }
    }

    private void validateAgainstPurchaseOrderItemLimits(List<GoodsReceiptRequestDTO.GrItemRequestDTO> items,
                                                        PurchaseOrder po,
                                                        Long excludedGoodsReceiptId,
                                                        boolean includeDraftReceipts) {
        Map<Long, Integer> requestedQtyByPoItemId = new HashMap<>();

        for (GoodsReceiptRequestDTO.GrItemRequestDTO itemDto : items) {
            if (itemDto.getReceivedQty() == null || itemDto.getReceivedQty() <= 0) {
                throw new RuntimeException("receivedQty must be greater than 0");
            }
            if (itemDto.getUnitCost() == null || itemDto.getUnitCost().compareTo(BigDecimal.ZERO) < 0) {
                throw new RuntimeException("unitCost must be >= 0");
            }

            PurchaseOrderItem poItem = poItemRepository.findById(itemDto.getPoItemId())
                    .orElseThrow(() -> new RuntimeException("Purchase Order Item not found"));

            if (poItem.getPurchaseOrder() == null || !poItem.getPurchaseOrder().getId().equals(po.getId())) {
                throw new RuntimeException("Purchase Order Item does not belong to the specified Purchase Order: " + po.getId());
            }
            if (poItem.getProduct() == null || !poItem.getProduct().getId().equals(itemDto.getProductId())) {
                throw new RuntimeException("Goods receipt product does not match the referenced purchase order item: " + itemDto.getPoItemId());
            }

            requestedQtyByPoItemId.merge(itemDto.getPoItemId(), itemDto.getReceivedQty(), Integer::sum);
        }

        if (Boolean.TRUE.equals(po.getAllowOverReceipt())) {
            return;
        }

        for (Map.Entry<Long, Integer> requestedEntry : requestedQtyByPoItemId.entrySet()) {
            Long poItemId = requestedEntry.getKey();
            int requestedQty = requestedEntry.getValue();
            PurchaseOrderItem poItem = poItemRepository.findById(poItemId)
                    .orElseThrow(() -> new RuntimeException("Purchase Order Item not found"));

            int alreadyPosted = safeQty(excludedGoodsReceiptId == null
                    ? grItemRepository.sumReceivedQtyByPurchaseOrderItemIdAndReceiptStatus(poItemId, DocumentStatus.POSTED)
                    : grItemRepository.sumReceivedQtyByPurchaseOrderItemIdAndReceiptStatusExcludingGoodsReceiptId(poItemId, DocumentStatus.POSTED, excludedGoodsReceiptId));

            int alreadyDraft = 0;
            if (includeDraftReceipts) {
                alreadyDraft = safeQty(excludedGoodsReceiptId == null
                        ? grItemRepository.sumReceivedQtyByPurchaseOrderItemIdAndReceiptStatus(poItemId, DocumentStatus.DRAFT)
                        : grItemRepository.sumReceivedQtyByPurchaseOrderItemIdAndReceiptStatusExcludingGoodsReceiptId(poItemId, DocumentStatus.DRAFT, excludedGoodsReceiptId));
            }

            int maxQty = poItem.getOrderedQty() == null ? 0 : poItem.getOrderedQty();
            if (alreadyPosted + alreadyDraft + requestedQty > maxQty) {
                throw new RuntimeException("Received quantity exceeds available quantity (ordered - draft - posted) for purchase order item: " + poItemId);
            }
        }
    }

    private void validatePostedLimitsOnComplete(List<GoodsReceiptItem> items, PurchaseOrder po, Long goodsReceiptId) {
        if (Boolean.TRUE.equals(po.getAllowOverReceipt())) {
            return;
        }

        Map<Long, Integer> requestedQtyByPoItemId = new HashMap<>();
        for (GoodsReceiptItem item : items) {
            Long poItemId = item.getPurchaseOrderItem() != null ? item.getPurchaseOrderItem().getId() : null;
            if (poItemId == null) {
                throw new RuntimeException("Goods receipt item is missing purchase order item reference");
            }
            requestedQtyByPoItemId.merge(poItemId, item.getReceivedQty(), Integer::sum);
        }

        for (Map.Entry<Long, Integer> requestedEntry : requestedQtyByPoItemId.entrySet()) {
            Long poItemId = requestedEntry.getKey();
            int requestedQty = requestedEntry.getValue();
            PurchaseOrderItem poItem = poItemRepository.findById(poItemId)
                    .orElseThrow(() -> new RuntimeException("Purchase Order Item not found"));

            int alreadyPosted = safeQty(grItemRepository
                    .sumReceivedQtyByPurchaseOrderItemIdAndReceiptStatusExcludingGoodsReceiptId(poItemId, DocumentStatus.POSTED, goodsReceiptId));

            int maxQty = poItem.getOrderedQty() == null ? 0 : poItem.getOrderedQty();
            if (alreadyPosted + requestedQty > maxQty) {
                throw new RuntimeException("Received quantity exceeds ordered quantity for purchase order item: " + poItemId);
            }
        }
    }

    private void syncPurchaseOrderReceiptState(PurchaseOrder po) {
        List<PurchaseOrderItem> poItems = poItemRepository.findByPurchaseOrderId(po.getId());
        Map<Long, Integer> postedReceivedByPoItemId = grItemRepository
                .sumReceivedQtyByPurchaseOrderIdAndReceiptStatus(po.getId(), DocumentStatus.POSTED)
                .stream()
                .collect(Collectors.toMap(
                        GoodsReceiptItemRepository.PoItemReceivedQtyProjection::getPoItemId,
                        projection -> safeQty(projection.getReceivedQty())
                ));

        boolean anyPostedReceipt = postedReceivedByPoItemId.values().stream().anyMatch(qty -> qty > 0);
        boolean fullyReceived = !poItems.isEmpty() && poItems.stream().allMatch(item -> {
            int orderedQty = item.getOrderedQty() == null ? 0 : item.getOrderedQty();
            int postedQty = postedReceivedByPoItemId.getOrDefault(item.getId(), 0);
            return postedQty >= orderedQty;
        });

        PurchaseOrderReceiptProgress receiptProgress = PurchaseOrderReceiptProgress.NOT_RECEIVED;
        if (fullyReceived) {
            receiptProgress = PurchaseOrderReceiptProgress.FULLY_RECEIVED;
        } else if (anyPostedReceipt) {
            receiptProgress = PurchaseOrderReceiptProgress.PARTIALLY_RECEIVED;
        }

        po.setReceiptProgress(receiptProgress);
        if (fullyReceived) {
            if (po.getClosedAt() == null) {
                po.setClosedAt(LocalDateTime.now());
            }
            po.setClosedReason(PurchaseOrderClosedReason.FULLY_RECEIVED);
        } else if (po.getClosedReason() == PurchaseOrderClosedReason.FULLY_RECEIVED) {
            po.setClosedAt(null);
            po.setClosedReason(null);
        }

        poRepository.save(po);
    }

    private int safeQty(Integer qty) {
        return qty == null ? 0 : qty;
    }

    private Totals calculateTotals(List<GoodsReceiptRequestDTO.GrItemRequestDTO> items, BigDecimal surcharge, BigDecimal discount) {
        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal totalVat = BigDecimal.ZERO;

        for (GoodsReceiptRequestDTO.GrItemRequestDTO itemDto : items) {
            if (itemDto.getReceivedQty() == null || itemDto.getReceivedQty() <= 0) {
                throw new RuntimeException("receivedQty must be greater than 0");
            }
            if (itemDto.getUnitCost() == null || itemDto.getUnitCost().compareTo(BigDecimal.ZERO) < 0) {
                throw new RuntimeException("unitCost must be >= 0");
            }

            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            BigDecimal lineTotal = itemDto.getUnitCost().multiply(BigDecimal.valueOf(itemDto.getReceivedQty()));
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

    private GoodsReceiptDetailResponseDTO toDetailResponseDTO(GoodsReceipt gr) {
        List<GoodsReceiptItem> items = grItemRepository.findByGoodsReceiptId(gr.getId());
        List<GoodsReceiptDetailResponseDTO.GrItemResponseDTO> itemDtos = items.stream().map(item ->
                GoodsReceiptDetailResponseDTO.GrItemResponseDTO.builder()
                        .id(item.getId())
                        .poItemId(item.getPurchaseOrderItem() != null ? item.getPurchaseOrderItem().getId() : null)
                        .productId(item.getProduct().getId())
                        .productSku(item.getProduct().getSku())
                        .productName(item.getProduct().getName())
                        .receivedQty(item.getReceivedQty())
                        .unitCost(item.getUnitCost())
                        .vatRate(item.getProduct().getVatRate())
                        .lineTotal(item.getLineTotal())
                        .build()
        ).collect(Collectors.toList());

        return GoodsReceiptDetailResponseDTO.builder()
                .id(gr.getId())
                .grNo(gr.getGrNo())
                .poId(gr.getPurchaseOrder() != null ? gr.getPurchaseOrder().getId() : null)
                .poNo(gr.getPurchaseOrder() != null ? gr.getPurchaseOrder().getPoNo() : null)
                .supplierId(gr.getSupplier() != null ? gr.getSupplier().getId().toString() : null)
                .supplierName(gr.getSupplier() != null ? gr.getSupplier().getName() : null)
                .warehouseId(gr.getWarehouse() != null ? gr.getWarehouse().getId() : null)
                .warehouseName(gr.getWarehouse() != null ? gr.getWarehouse().getName() : null)
                .createdById(gr.getCreatedBy() != null ? gr.getCreatedBy().getId().toString() : null)
                .createdByName(gr.getCreatedBy() != null ? gr.getCreatedBy().getFullName() : null)
                .receiptDate(gr.getReceiptDate())
                .status(gr.getStatus())
                .note(gr.getNote())
                .totalAmount(gr.getTotalAmount())
                .totalVat(gr.getTotalVat())
                .discountAmount(gr.getDiscountAmount())
                .surchargeAmount(gr.getSurchargeAmount())
                .totalAmountPayable(gr.getTotalAmountPayable())
                .createdAt(gr.getCreatedAt())
                .items(itemDtos)
                .build();
    }
}