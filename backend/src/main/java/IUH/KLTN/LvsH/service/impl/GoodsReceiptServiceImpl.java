package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.dto.goods_receipt.*;
import IUH.KLTN.LvsH.entity.*;
import IUH.KLTN.LvsH.enums.DocumentStatus;
import IUH.KLTN.LvsH.repository.*;
import IUH.KLTN.LvsH.repository.specification.GoodsReceiptSpecification;
import IUH.KLTN.LvsH.service.GoodsReceiptService;
import IUH.KLTN.LvsH.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

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
        Supplier supplier = supplierRepository.findById(UUID.fromString(dto.getSupplierId()))
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        Warehouse warehouse = warehouseRepository.findById(dto.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));
        Staff staff = getAuthenticatedStaff();

        validateItemList(dto.getItems());
        
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
        
        for (GoodsReceiptRequestDTO.GrItemRequestDTO itemDto : dto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            PurchaseOrderItem poItem = poItemRepository.findById(itemDto.getPoItemId())
                    .orElseThrow(() -> new RuntimeException("Purchase Order Item not found"));
            
            // Validate that poItem belongs to the parent PO
            if (poItem.getPurchaseOrder() == null || !poItem.getPurchaseOrder().getId().equals(po.getId())) {
                throw new RuntimeException("Purchase Order Item does not belong to the specified Purchase Order: " + dto.getPoId());
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

        return toDetailResponseDTO(gr);
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
    public GoodsReceiptDetailResponseDTO updateDraftGoodsReceipt(Long id, GoodsReceiptRequestDTO dto) {
        validateItemList(dto.getItems());

        GoodsReceipt gr = getGoodsReceiptById(id);
        if (gr.getStatus() != DocumentStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT goods receipt can be updated");
        }

        PurchaseOrder po = poRepository.findById(dto.getPoId())
                .orElseThrow(() -> new RuntimeException("PO not found"));
        Supplier supplier = supplierRepository.findById(UUID.fromString(dto.getSupplierId()))
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        Warehouse warehouse = warehouseRepository.findById(dto.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));

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
        for (GoodsReceiptRequestDTO.GrItemRequestDTO itemDto : dto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            PurchaseOrderItem poItem = poItemRepository.findById(itemDto.getPoItemId())
                    .orElseThrow(() -> new RuntimeException("Purchase Order Item not found"));
            
            // Validate that poItem belongs to the parent PO
            if (poItem.getPurchaseOrder() == null || !poItem.getPurchaseOrder().getId().equals(po.getId())) {
                throw new RuntimeException("Purchase Order Item does not belong to the specified Purchase Order: " + dto.getPoId());
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
            throw new RuntimeException("Goods Receipt is already completed.");
        }

        // 1. Cáº­p nháº­t tráº¡ng thÃ¡i GR
        gr.setStatus(DocumentStatus.POSTED);
        grRepository.save(gr);

        List<GoodsReceiptItem> items = grItemRepository.findByGoodsReceiptId(gr.getId());

        for (GoodsReceiptItem item : items) {
            Product product = item.getProduct();

            // 2. TÃ­nh toÃ¡n Moving Average Cost
            BigDecimal oldQty = BigDecimal.valueOf(
                productRepository.calculateGlobalOnHandByProductId(product.getId()));
            BigDecimal oldAvgCost = product.getAvgCost();

            BigDecimal receivedQty = BigDecimal.valueOf(item.getReceivedQty());
            BigDecimal incomingUnitCost = item.getUnitCost();

            BigDecimal newTotalValue = oldQty.multiply(oldAvgCost).add(receivedQty.multiply(incomingUnitCost));
            BigDecimal newTotalQty = oldQty.add(receivedQty);

            BigDecimal newAvgCost = oldAvgCost; // Default náº¿u chia 0
            if (newTotalQty.compareTo(BigDecimal.ZERO) > 0) {
                newAvgCost = newTotalValue.divide(newTotalQty, 2, RoundingMode.HALF_UP);
            }

            // 3. Cáº­p nháº­t Product
            product.setAvgCost(newAvgCost);
            product.setLastPurchaseCost(incomingUnitCost);
            productRepository.save(product);

            // 4. Ghi nháº­n Inventory Movement
            InventoryMovement movement = InventoryMovement.builder()
                    .product(product)
                    .warehouse(gr.getWarehouse())
                    .movementType(IUH.KLTN.LvsH.enums.InventoryMovementType.PURCHASE_IN)
                    .qty(item.getReceivedQty())
                    .refTable("goods_receipts")
                    .refId(gr.getGrNo())
                    .createdBy(gr.getCreatedBy())
                    .build();

            inventoryMovementRepository.save(movement);
        }

        // Tá»± Ä‘á»™ng chuyá»ƒn PO sang tráº¡ng thÃ¡i DELIVERED náº¿u trÃ¹ng khá»›p (CÃ³ thá»ƒ check qty sau)
        PurchaseOrder po = gr.getPurchaseOrder();
        po.setStatus(DocumentStatus.POSTED);
        poRepository.save(po);

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
            throw new RuntimeException("Goods Receipt is already cancelled.");
        }
        gr.setStatus(DocumentStatus.CANCELLED);
        grRepository.save(gr);
        return toDetailResponseDTO(gr);
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

    private void validateItemList(List<GoodsReceiptRequestDTO.GrItemRequestDTO> items) {
        if (items == null || items.isEmpty()) {
            throw new RuntimeException("Goods receipt items are required");
        }
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
