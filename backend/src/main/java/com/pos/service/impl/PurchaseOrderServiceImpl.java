package com.pos.service.impl;

import com.pos.dto.CreatePurchaseOrderDto;
import com.pos.entity.*;
import com.pos.enums.DocumentStatus;
import com.pos.repository.*;
import com.pos.service.PurchaseOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PurchaseOrderServiceImpl implements PurchaseOrderService {

    private final PurchaseOrderRepository poRepository;
    private final PurchaseOrderItemRepository poItemRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final StaffRepository staffRepository;
    private final WarehouseRepository warehouseRepository;

    @Override
    public List<PurchaseOrder> getAllPurchaseOrders() {
        return poRepository.findAll();
    }

    @Override
    public PurchaseOrder getPurchaseOrderById(Long id) {
        return poRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase Order not found"));
    }

    @Override
    @Transactional
    public PurchaseOrder createPurchaseOrder(CreatePurchaseOrderDto dto) {
        Supplier supplier = supplierRepository.findById(UUID.fromString(dto.getSupplierId()))
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        Staff staff = staffRepository.findById(dto.getCreatedByStaffId())
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        Warehouse warehouse = dto.getWarehouseId() != null 
                ? warehouseRepository.findById(dto.getWarehouseId()).orElse(null) 
                : null;

        PurchaseOrder po = PurchaseOrder.builder()
                .supplier(supplier)
                .warehouse(warehouse)
                .orderDate(LocalDate.now())
                .expectedDate(dto.getExpectedDate() != null ? LocalDate.parse(dto.getExpectedDate()) : null)
                .status(DocumentStatus.DRAFT)
                .note(dto.getNote())
                .totalAmount(dto.getTotalAmount())
                .totalVat(dto.getTotalVat())
                .totalAmountPayable(dto.getTotalAmountPayable())
                .createdBy(staff)
                .build();

        poRepository.saveAndFlush(po);
        String generatedPoNo = poRepository.findPoNoById(po.getId());
        po.setPoNo(generatedPoNo);
        
        for (CreatePurchaseOrderDto.PoItemDto itemDto : dto.getItems()) {
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

        return po;
    }

    @Override
    @Transactional
    public PurchaseOrder updateStatus(Long id, String newStatus) {
        PurchaseOrder po = getPurchaseOrderById(id);
        // Có thể thêm logic lưu Audit Log ở đây khi change status
        po.setStatus(DocumentStatus.valueOf(newStatus));
        return poRepository.save(po);
    }
}
