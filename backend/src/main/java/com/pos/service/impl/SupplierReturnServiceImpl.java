package com.pos.service.impl;

import com.pos.dto.SupplierReturnRequestDTO;
import com.pos.dto.SupplierReturnResponseDTO;
import com.pos.entity.*;
import com.pos.enums.DocumentStatus;
import com.pos.enums.InventoryMovementType;
import com.pos.repository.*;
import com.pos.service.SupplierReturnService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SupplierReturnServiceImpl implements SupplierReturnService {

    private final SupplierReturnRepository srRepository;
    private final SupplierReturnItemRepository srItemRepository;
    private final SupplierRepository supplierRepository;
    private final GoodsReceiptRepository grRepository;
    private final GoodsReceiptItemRepository grItemRepository;
    private final ProductRepository productRepository;
    private final StaffRepository staffRepository;
    private final WarehouseRepository warehouseRepository;
    private final InventoryMovementRepository movementRepository;

    @Override
    public List<SupplierReturn> getAllSupplierReturns() {
        return srRepository.findAll();
    }

    @Override
    public SupplierReturn getSupplierReturnById(Long id) {
        return srRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier Return not found: " + id));
    }

    @Override
    @Transactional
    public SupplierReturnResponseDTO createSupplierReturn(SupplierReturnRequestDTO dto) {
        validateItemList(dto.getItems());

        Supplier supplier = supplierRepository.findById(UUID.fromString(dto.getSupplierId()))
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        Staff staff = staffRepository.findById(dto.getCreatedByStaffId())
                .orElseThrow(() -> new RuntimeException("Staff not found"));
        Warehouse warehouse = warehouseRepository.findById(dto.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));

        GoodsReceipt goodsReceipt = null;
        if (dto.getGoodsReceiptId() != null) {
            goodsReceipt = grRepository.findById(dto.getGoodsReceiptId()).orElse(null);
        }

        Totals totals = calculateTotals(dto.getItems());

        SupplierReturn sr = SupplierReturn.builder()
                .supplier(supplier)
                .goodsReceipt(goodsReceipt)
                .warehouse(warehouse)
                .returnDate(LocalDate.now())
                .status(DocumentStatus.DRAFT)
                .note(dto.getNote())
                .totalAmount(totals.totalAmount)
                .totalVat(totals.totalVat)
                .totalAmountPayable(totals.totalAmountPayable)
                .createdBy(staff)
                .build();

        srRepository.saveAndFlush(sr);
        String generatedReturnNo = srRepository.findReturnNoById(sr.getId());
        sr.setReturnNo(generatedReturnNo);

        for (SupplierReturnRequestDTO.ReturnItemRequestDTO itemDto : dto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            GoodsReceiptItem grItem = null;
            if (itemDto.getGoodsReceiptItemId() != null) {
                grItem = grItemRepository.findById(itemDto.getGoodsReceiptItemId()).orElse(null);
            }

            SupplierReturnItem item = SupplierReturnItem.builder()
                    .supplierReturn(sr)
                    .goodsReceiptItem(grItem)
                    .product(product)
                    .qty(itemDto.getQty())
                    .returnAmount(itemDto.getReturnAmount())
                    .note(itemDto.getNote())
                    .build();

            srItemRepository.save(item);
        }

        return toResponseDTO(sr);
    }

    @Override
    @Transactional
    public SupplierReturnResponseDTO updateDraftSupplierReturn(Long id, SupplierReturnRequestDTO dto) {
        validateItemList(dto.getItems());

        SupplierReturn sr = getSupplierReturnById(id);
        if (sr.getStatus() != DocumentStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT supplier return can be updated");
        }

        Supplier supplier = supplierRepository.findById(UUID.fromString(dto.getSupplierId()))
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        Warehouse warehouse = warehouseRepository.findById(dto.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));

        GoodsReceipt goodsReceipt = null;
        if (dto.getGoodsReceiptId() != null) {
            goodsReceipt = grRepository.findById(dto.getGoodsReceiptId()).orElse(null);
        }

        Totals totals = calculateTotals(dto.getItems());

        sr.setSupplier(supplier);
        sr.setGoodsReceipt(goodsReceipt);
        sr.setWarehouse(warehouse);
        sr.setNote(dto.getNote());
        sr.setTotalAmount(totals.totalAmount);
        sr.setTotalVat(totals.totalVat);
        sr.setTotalAmountPayable(totals.totalAmountPayable);

        srItemRepository.deleteBySupplierReturnId(sr.getId());
        for (SupplierReturnRequestDTO.ReturnItemRequestDTO itemDto : dto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            GoodsReceiptItem grItem = null;
            if (itemDto.getGoodsReceiptItemId() != null) {
                grItem = grItemRepository.findById(itemDto.getGoodsReceiptItemId()).orElse(null);
            }

            SupplierReturnItem item = SupplierReturnItem.builder()
                    .supplierReturn(sr)
                    .goodsReceiptItem(grItem)
                    .product(product)
                    .qty(itemDto.getQty())
                    .returnAmount(itemDto.getReturnAmount())
                    .note(itemDto.getNote())
                    .build();

            srItemRepository.save(item);
        }

        return toResponseDTO(srRepository.save(sr));
    }

    @Override
    @Transactional
    public SupplierReturnResponseDTO completeSupplierReturn(Long id) {
        SupplierReturn sr = getSupplierReturnById(id);

        if (sr.getStatus() == DocumentStatus.CANCELLED) {
            throw new RuntimeException("Cancelled return cannot be completed");
        }
        if (sr.getStatus() == DocumentStatus.POSTED) {
            throw new RuntimeException("Return already completed");
        }

        sr.setStatus(DocumentStatus.POSTED);
        srRepository.save(sr);

        List<SupplierReturnItem> items = srItemRepository.findBySupplierReturnId(sr.getId());

        for (SupplierReturnItem item : items) {
            InventoryMovement movement = InventoryMovement.builder()
                    .product(item.getProduct())
                    .warehouse(sr.getWarehouse())
                    .movementType(InventoryMovementType.RETURN_OUT)
                    .qty(item.getQty())
                    .refTable("supplier_returns")
                    .refId(sr.getReturnNo())
                    .createdBy(sr.getCreatedBy())
                    .build();

            movementRepository.save(movement);
        }

        return toResponseDTO(sr);
    }

    private void validateItemList(List<SupplierReturnRequestDTO.ReturnItemRequestDTO> items) {
        if (items == null || items.isEmpty()) {
            throw new RuntimeException("Supplier return items are required");
        }
        for (SupplierReturnRequestDTO.ReturnItemRequestDTO itemDto : items) {
            if (itemDto.getQty() == null || itemDto.getQty() <= 0) {
                throw new RuntimeException("qty must be greater than 0");
            }
            if (itemDto.getReturnAmount() == null || itemDto.getReturnAmount().compareTo(BigDecimal.ZERO) < 0) {
                throw new RuntimeException("returnAmount must be >= 0");
            }
        }
    }

    private Totals calculateTotals(List<SupplierReturnRequestDTO.ReturnItemRequestDTO> items) {
        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal totalVat = BigDecimal.ZERO;

        for (SupplierReturnRequestDTO.ReturnItemRequestDTO itemDto : items) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            BigDecimal lineAmount = itemDto.getReturnAmount();
            BigDecimal vatRate = product.getVatRate() == null ? BigDecimal.ZERO : product.getVatRate();
            BigDecimal lineVat = lineAmount.multiply(vatRate).divide(BigDecimal.valueOf(100));

            totalAmount = totalAmount.add(lineAmount);
            totalVat = totalVat.add(lineVat);
        }

        return new Totals(totalAmount, totalVat, totalAmount.add(totalVat));
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

    private SupplierReturnResponseDTO toResponseDTO(SupplierReturn sr) {
        SupplierReturnResponseDTO res = new SupplierReturnResponseDTO();
        res.setId(sr.getId());
        res.setReturnNo(sr.getReturnNo());
        res.setStatus(sr.getStatus());
        res.setTotalAmount(sr.getTotalAmount());
        res.setTotalVat(sr.getTotalVat());
        res.setTotalAmountPayable(sr.getTotalAmountPayable());
        return res;
    }
}
