package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.dto.StockAdjustmentRequestDTO;
import IUH.KLTN.LvsH.dto.StockAdjustmentResponseDTO;
import IUH.KLTN.LvsH.entity.*;
import IUH.KLTN.LvsH.enums.DocumentStatus;
import IUH.KLTN.LvsH.repository.*;
import IUH.KLTN.LvsH.service.StockAdjustmentService;
import IUH.KLTN.LvsH.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    public StockAdjustmentResponseDTO createAdjustment(StockAdjustmentRequestDTO dto) {
        validateItemList(dto.getItems());

        Warehouse warehouse = warehouseRepository.findById(dto.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));
        Staff staff = getAuthenticatedStaff();

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
        
        for (StockAdjustmentRequestDTO.AdjustmentItemRequestDTO itemDto : dto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            int systemQty = productRepository.calculateOnHandByWarehouseAndProductId(
                warehouse.getId(), product.getId());
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

        return toResponseDTO(adjust);
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
    public StockAdjustmentResponseDTO updateDraftAdjustment(Long id, StockAdjustmentRequestDTO dto) {
        validateItemList(dto.getItems());

        StockAdjustment adjust = getAdjustmentById(id);
        if (adjust.getStatus() != DocumentStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT stock adjustment can be updated");
        }

        Warehouse warehouse = warehouseRepository.findById(dto.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));

        adjust.setWarehouse(warehouse);
        adjust.setReason(dto.getReason());
        adjust.setNote(dto.getNote());

        adjustItemRepository.deleteByAdjustmentId(adjust.getId());
        for (StockAdjustmentRequestDTO.AdjustmentItemRequestDTO itemDto : dto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            int systemQty = productRepository.calculateOnHandByWarehouseAndProductId(
                    warehouse.getId(), product.getId());
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

        return toResponseDTO(adjustRepository.save(adjust));
    }

    @Override
    @Transactional
    public StockAdjustmentResponseDTO completeAdjustment(Long id) {
        StockAdjustment adjust = getAdjustmentById(id);

        if (adjust.getStatus() == DocumentStatus.CANCELLED) {
            throw new RuntimeException("Cancelled adjustment cannot be completed");
        }
        if (adjust.getStatus() == DocumentStatus.POSTED) {
            throw new RuntimeException("Adjustment already completed");
        }
        
        adjust.setStatus(DocumentStatus.POSTED);
        adjustRepository.save(adjust);

        List<StockAdjustmentItem> items = adjustItemRepository.findByAdjustmentId(adjust.getId());

        for (StockAdjustmentItem item : items) {
            Product product = item.getProduct();

            // Náº¿u khÃ´ng cÃ³ khÃ¡c biá»‡t, bá» qua
            if (item.getDiffQty() == 0) {
                continue;
            }

            IUH.KLTN.LvsH.enums.InventoryMovementType type = item.getDiffQty() > 0
                    ? IUH.KLTN.LvsH.enums.InventoryMovementType.ADJUST_IN
                    : IUH.KLTN.LvsH.enums.InventoryMovementType.ADJUST_OUT;

            InventoryMovement act = InventoryMovement.builder()
                    .product(product)
                    .warehouse(adjust.getWarehouse())
                    .movementType(type)
                    .qty(Math.abs(item.getDiffQty()))
                    .refTable("stock_adjustments")
                    .refId(adjust.getAdjustNo())
                    .createdBy(adjust.getCreatedBy())
                    .build();

            movementRepository.save(act);
        }
        return toResponseDTO(adjust);
    }

    private void validateItemList(List<StockAdjustmentRequestDTO.AdjustmentItemRequestDTO> items) {
        if (items == null || items.isEmpty()) {
            throw new RuntimeException("Stock adjustment items are required");
        }
        for (StockAdjustmentRequestDTO.AdjustmentItemRequestDTO itemDto : items) {
            if (itemDto.getActualQty() == null || itemDto.getActualQty() < 0) {
                throw new RuntimeException("actualQty must be >= 0");
            }
        }
    }

    private StockAdjustmentResponseDTO toResponseDTO(StockAdjustment adjust) {
        StockAdjustmentResponseDTO res = new StockAdjustmentResponseDTO();
        res.setId(adjust.getId());
        res.setAdjustNo(adjust.getAdjustNo());
        res.setStatus(adjust.getStatus());
        return res;
    }
}
