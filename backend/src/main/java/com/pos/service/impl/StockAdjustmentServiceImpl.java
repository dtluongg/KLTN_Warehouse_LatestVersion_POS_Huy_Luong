package com.pos.service.impl;

import com.pos.dto.CreateStockAdjustmentDto;
import com.pos.entity.*;
import com.pos.enums.DocumentStatus;
import com.pos.repository.*;
import com.pos.service.StockAdjustmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StockAdjustmentServiceImpl implements StockAdjustmentService {

    private final StockAdjustmentRepository adjustRepository;
    private final StockAdjustmentItemRepository adjustItemRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final StaffRepository staffRepository;
    private final InventoryMovementRepository movementRepository;

    @Override
    public List<StockAdjustment> getAllAdjustments() {
        return adjustRepository.findAll();
    }

    @Override
    public StockAdjustment getAdjustmentById(Long id) {
        return adjustRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Stock Adjustment not found"));
    }

    @Override
    @Transactional
    public StockAdjustment createAdjustment(CreateStockAdjustmentDto dto) {
        Warehouse warehouse = warehouseRepository.findById(dto.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));
        Staff staff = staffRepository.findById(dto.getCreatedByStaffId())
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        StockAdjustment adjust = StockAdjustment.builder()
                .warehouse(warehouse)
                .adjustDate(LocalDate.now())
                .status(DocumentStatus.DRAFT)
                .reason(dto.getReason())
                .note(dto.getNote())
                .createdBy(staff)
                .build();

        adjustRepository.saveAndFlush(adjust);
        String generatedAdjustNo = adjustRepository.findAdjustNoById(adjust.getId());
        adjust.setAdjustNo(generatedAdjustNo);
        
        for (CreateStockAdjustmentDto.AdjustmentItemDto itemDto : dto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            int systemQty = product.getOnHand();
            int diffQty = itemDto.getActualQty() - systemQty;

            StockAdjustmentItem item = StockAdjustmentItem.builder()
                    .adjustment(adjust)
                    .product(product)
                    .systemQty(systemQty)
                    .actualQty(itemDto.getActualQty())
                    .diffQty(diffQty)
                    .unitCostSnapshot(product.getAvgCost())
                    .build();

            adjustItemRepository.save(item);
        }

        return adjust;
    }

    @Override
    @Transactional
    public StockAdjustment completeAdjustment(Long id) {
        StockAdjustment adjust = getAdjustmentById(id);
        
        if (adjust.getStatus() == DocumentStatus.POSTED) {
            throw new RuntimeException("Adjustment already completed");
        }
        
        adjust.setStatus(DocumentStatus.POSTED);
        adjustRepository.save(adjust);

        List<StockAdjustmentItem> items = adjustItemRepository.findAll();
        
        for (StockAdjustmentItem item : items) {
            if (item.getAdjustment().getId().equals(adjust.getId())) {
                Product product = item.getProduct();
                
                // Nếu không có khác biệt, bỏ qua
                if (item.getDiffQty() == 0) continue;

                // Inventory Movement (Nếu lệch dương thì IN, lệch âm thì OUT)
                com.pos.enums.InventoryMovementType type = item.getDiffQty() > 0 ? com.pos.enums.InventoryMovementType.ADJUST_IN : com.pos.enums.InventoryMovementType.ADJUST_OUT;
                
                InventoryMovement act = InventoryMovement.builder()
                        .product(product)
                        .warehouse(adjust.getWarehouse())
                        .movementType(type)
                        .qty(Math.abs(item.getDiffQty())) // Luôn dương để DB Trigger tính TOÁN
                        .refTable("stock_adjustments")
                        .refId(adjust.getAdjustNo())
                        .createdBy(adjust.getCreatedBy())
                        .build();

                movementRepository.save(act);
            }
        }
        return adjust;
    }
}
