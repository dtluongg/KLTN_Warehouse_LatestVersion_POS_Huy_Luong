package com.pos.service.impl;

import com.pos.dto.GoodsReceiptRequestDTO;
import com.pos.dto.GoodsReceiptResponseDTO;
import com.pos.entity.*;
import com.pos.enums.DocumentStatus;
import com.pos.repository.*;
import com.pos.service.GoodsReceiptService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

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
    private final StaffRepository staffRepository;
    private final InventoryMovementRepository inventoryMovementRepository;

    @Override
    public List<GoodsReceipt> getAllGoodsReceipts() {
        return grRepository.findAll();
    }

    @Override
    public GoodsReceipt getGoodsReceiptById(Long id) {
        return grRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goods Receipt not found"));
    }

    @Override
    @Transactional
    public GoodsReceiptResponseDTO createGoodsReceipt(GoodsReceiptRequestDTO dto) {
        PurchaseOrder po = poRepository.findById(dto.getPoId())
                .orElseThrow(() -> new RuntimeException("PO not found"));
        Supplier supplier = supplierRepository.findById(UUID.fromString(dto.getSupplierId()))
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        Warehouse warehouse = warehouseRepository.findById(dto.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));
        Staff staff = staffRepository.findById(dto.getCreatedByStaffId())
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        validateItemList(dto.getItems());
        Totals totals = calculateTotals(dto.getItems());

        GoodsReceipt gr = GoodsReceipt.builder()
                .purchaseOrder(po)
                .supplier(supplier)
                .warehouse(warehouse)
                .receiptDate(LocalDate.now())
                .status(DocumentStatus.DRAFT)
                .note(dto.getNote())
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
                    .orElse(null);

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

        return toResponseDTO(gr);
    }

    @Override
    @Transactional
    public GoodsReceiptResponseDTO updateDraftGoodsReceipt(Long id, GoodsReceiptRequestDTO dto) {
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

        Totals totals = calculateTotals(dto.getItems());

        gr.setPurchaseOrder(po);
        gr.setSupplier(supplier);
        gr.setWarehouse(warehouse);
        gr.setNote(dto.getNote());
        gr.setTotalAmount(totals.totalAmount);
        gr.setTotalVat(totals.totalVat);
        gr.setTotalAmountPayable(totals.totalAmountPayable);

        grItemRepository.deleteByGoodsReceiptId(gr.getId());
        for (GoodsReceiptRequestDTO.GrItemRequestDTO itemDto : dto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            PurchaseOrderItem poItem = poItemRepository.findById(itemDto.getPoItemId())
                    .orElse(null);

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

        return toResponseDTO(grRepository.save(gr));
    }

    @Override
    @Transactional
    public GoodsReceiptResponseDTO completeGoodsReceipt(Long id) {
        GoodsReceipt gr = getGoodsReceiptById(id);
        
        if (gr.getStatus() == DocumentStatus.CANCELLED) {
            throw new RuntimeException("Cancelled goods receipt cannot be completed.");
        }
        if (gr.getStatus() == DocumentStatus.POSTED) {
            throw new RuntimeException("Goods Receipt is already completed.");
        }

        // 1. Cập nhật trạng thái GR
        gr.setStatus(DocumentStatus.POSTED);
        grRepository.save(gr);

        List<GoodsReceiptItem> items = grItemRepository.findByGoodsReceiptId(gr.getId());

        for (GoodsReceiptItem item : items) {
            Product product = item.getProduct();

            // 2. Tính toán Moving Average Cost
            BigDecimal oldQty = BigDecimal.valueOf(
                productRepository.calculateGlobalOnHandByProductId(product.getId()));
            BigDecimal oldAvgCost = product.getAvgCost();

            BigDecimal receivedQty = BigDecimal.valueOf(item.getReceivedQty());
            BigDecimal incomingUnitCost = item.getUnitCost();

            BigDecimal newTotalValue = oldQty.multiply(oldAvgCost).add(receivedQty.multiply(incomingUnitCost));
            BigDecimal newTotalQty = oldQty.add(receivedQty);

            BigDecimal newAvgCost = oldAvgCost; // Default nếu chia 0
            if (newTotalQty.compareTo(BigDecimal.ZERO) > 0) {
                newAvgCost = newTotalValue.divide(newTotalQty, 2, RoundingMode.HALF_UP);
            }

            // 3. Cập nhật Product
            product.setAvgCost(newAvgCost);
            product.setLastPurchaseCost(incomingUnitCost);
            productRepository.save(product);

            // 4. Ghi nhận Inventory Movement
            InventoryMovement movement = InventoryMovement.builder()
                    .product(product)
                    .warehouse(gr.getWarehouse())
                    .movementType(com.pos.enums.InventoryMovementType.PURCHASE_IN)
                    .qty(item.getReceivedQty())
                    .refTable("goods_receipts")
                    .refId(gr.getGrNo())
                    .createdBy(gr.getCreatedBy())
                    .build();

            inventoryMovementRepository.save(movement);
        }

        // Tự động chuyển PO sang trạng thái DELIVERED nếu trùng khớp (Có thể check qty sau)
        PurchaseOrder po = gr.getPurchaseOrder();
        po.setStatus(DocumentStatus.POSTED);
        poRepository.save(po);

        return toResponseDTO(gr);
    }

    private Totals calculateTotals(List<GoodsReceiptRequestDTO.GrItemRequestDTO> items) {
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

        return new Totals(totalAmount, totalVat, totalAmount.add(totalVat));
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

    private GoodsReceiptResponseDTO toResponseDTO(GoodsReceipt gr) {
        GoodsReceiptResponseDTO res = new GoodsReceiptResponseDTO();
        res.setId(gr.getId());
        res.setGrNo(gr.getGrNo());
        res.setStatus(gr.getStatus());
        res.setTotalAmount(gr.getTotalAmount());
        res.setTotalVat(gr.getTotalVat());
        res.setTotalAmountPayable(gr.getTotalAmountPayable());
        return res;
    }
}
