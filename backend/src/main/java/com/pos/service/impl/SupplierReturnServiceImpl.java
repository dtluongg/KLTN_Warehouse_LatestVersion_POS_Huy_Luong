package com.pos.service.impl;

import com.pos.dto.CreateSupplierReturnDto;
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
    public SupplierReturnResponseDTO createSupplierReturn(CreateSupplierReturnDto dto) {
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

        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal totalVat = BigDecimal.ZERO;

        for (CreateSupplierReturnDto.ReturnItemDto itemDto : dto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            BigDecimal lineAmount = itemDto.getReturnAmount();
            BigDecimal vatRate = product.getVatRate() == null ? BigDecimal.ZERO : product.getVatRate();
            BigDecimal lineVat = lineAmount.multiply(vatRate).divide(BigDecimal.valueOf(100));

            totalAmount = totalAmount.add(lineAmount);
            totalVat = totalVat.add(lineVat);
        }

        BigDecimal totalAmountPayable = totalAmount.add(totalVat);

        SupplierReturn sr = SupplierReturn.builder()
                .supplier(supplier)
                .goodsReceipt(goodsReceipt)
                .warehouse(warehouse)
                .returnDate(LocalDate.now())
                .status(DocumentStatus.DRAFT)
                .note(dto.getNote())
                .totalAmount(totalAmount)
                .totalVat(totalVat)
                .totalAmountPayable(totalAmountPayable)
                .createdBy(staff)
                .build();

        srRepository.saveAndFlush(sr);
        String generatedReturnNo = srRepository.findReturnNoById(sr.getId());
        sr.setReturnNo(generatedReturnNo);

        for (CreateSupplierReturnDto.ReturnItemDto itemDto : dto.getItems()) {
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
    public SupplierReturnResponseDTO completeSupplierReturn(Long id) {
        SupplierReturn sr = getSupplierReturnById(id);

        if (sr.getStatus() == DocumentStatus.POSTED) {
            throw new RuntimeException("Return already completed");
        }

        sr.setStatus(DocumentStatus.POSTED);
        srRepository.save(sr);

        // Lấy tất cả items của phiếu này
        List<SupplierReturnItem> items = srItemRepository.findAll();

        for (SupplierReturnItem item : items) {
            if (item.getSupplierReturn().getId().equals(sr.getId())) {
                // Trả hàng cho NCC → Hàng xuất ra khỏi kho (RETURN_OUT)
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
        }

        return toResponseDTO(sr);
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
