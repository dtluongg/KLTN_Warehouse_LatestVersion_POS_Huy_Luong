package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.dto.stock_adjustment.*;
import IUH.KLTN.LvsH.entity.*;
import IUH.KLTN.LvsH.enums.DocumentStatus;
import IUH.KLTN.LvsH.repository.*;
import IUH.KLTN.LvsH.repository.specification.StockAdjustmentSpecification;
import IUH.KLTN.LvsH.service.StockAdjustmentService;
import IUH.KLTN.LvsH.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StockAdjustmentServiceImpl implements StockAdjustmentService {

    private final StockAdjustmentRepository adjustRepository;
    private final StockAdjustmentItemRepository adjustItemRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final InventoryMovementRepository movementRepository;

    @Override
    public Page<StockAdjustmentListResponseDTO> getAllAdjustments(StockAdjustmentSearchCriteria criteria, Pageable pageable) {
        Page<StockAdjustment> page = adjustRepository.findAll(StockAdjustmentSpecification.withCriteria(criteria), pageable);
        return page.map(a -> StockAdjustmentListResponseDTO.builder()
                .id(a.getId())
                .adjustNo(a.getAdjustNo())
                .warehouseName(a.getWarehouse().getName())
                .adjustDate(a.getAdjustDate())
                .status(a.getStatus().name())
                .reason(a.getReason())
                .note(a.getNote())
                .createdBy(a.getCreatedBy().getFullName())
                .createdAt(a.getCreatedAt())
                .build());
    }

    private StockAdjustment getStockAdjustmentEntityById(Long id) {
        return adjustRepository.findById(id).orElseThrow(() -> new RuntimeException("Stock Adjustment not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public StockAdjustmentDetailResponseDTO getAdjustmentDetailById(Long id) {
        StockAdjustment a = getStockAdjustmentEntityById(id);
        List<StockAdjustmentItem> items = adjustItemRepository.findByAdjustmentId(a.getId());
        
        List<StockAdjustmentDetailResponseDTO.StockAdjustmentItemResponseDTO> itemDTOs = items.stream().map(i -> 
                StockAdjustmentDetailResponseDTO.StockAdjustmentItemResponseDTO.builder()
                        .id(i.getId())
                        .productId(i.getProduct().getId())
                        .productSku(i.getProduct().getSku())
                        .productName(i.getProduct().getName())
                        .adjustQty(i.getDiffQty()) // Return the difference
                        .build()
        ).collect(Collectors.toList());

        return StockAdjustmentDetailResponseDTO.builder()
                .id(a.getId())
                .adjustNo(a.getAdjustNo())
                .warehouseId(a.getWarehouse().getId())
                .warehouseName(a.getWarehouse().getName())
                .adjustDate(a.getAdjustDate())
                .status(a.getStatus().name())
                .reason(a.getReason())
                .note(a.getNote())
                .createdBy(a.getCreatedBy().getFullName())
                .createdAt(a.getCreatedAt())
                .items(itemDTOs)
                .build();
    }

    @Override
    @Transactional
    public StockAdjustmentDetailResponseDTO createAdjustment(StockAdjustmentRequestDTO dto) {
        validateItemList(dto.getItems());

        Warehouse warehouse = warehouseRepository.findById(dto.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));
        Staff staff = getAuthenticatedStaff();

        StockAdjustment adjust = StockAdjustment.builder()
                .warehouse(warehouse)
                .adjustDate(dto.getAdjustDate() != null ? dto.getAdjustDate() : LocalDate.now())
                .status(DocumentStatus.DRAFT)
                .reason(dto.getReason())
                .note(dto.getNote())
                .createdBy(staff)
                .build();

        adjustRepository.saveAndFlush(adjust);
        String generatedAdjustNo = adjustRepository.findAdjustNoById(adjust.getId());
        adjust.setAdjustNo(generatedAdjustNo);
        
        for (StockAdjustmentRequestDTO.StockAdjustmentItemRequestDTO itemDto : dto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            int systemQty = productRepository.calculateOnHandByWarehouseAndProductId(
                warehouse.getId(), product.getId());
            int actualQty = systemQty + itemDto.getAdjustQty(); // Because positive=add, negative=subtract
            if (actualQty < 0) {
                // Cannot adjust below 0 in total logically, though sometimes supported. Let's enforce >= 0 actual.
                throw new RuntimeException("Adjustment results in negative actual stock for: " + product.getSku());
            }

            StockAdjustmentItem item = StockAdjustmentItem.builder()
                    .adjustment(adjust)
                    .product(product)
                    .systemQty(systemQty)
                    .actualQty(actualQty)
                    .diffQty(itemDto.getAdjustQty())
                    .unitCostSnapshot(product.getAvgCost())
                    .build();

            adjustItemRepository.save(item);
        }

        return getAdjustmentDetailById(adjust.getId());
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
    public StockAdjustmentDetailResponseDTO updateDraftAdjustment(Long id, StockAdjustmentRequestDTO dto) {
        validateItemList(dto.getItems());

        StockAdjustment adjust = getStockAdjustmentEntityById(id);
        if (adjust.getStatus() != DocumentStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT stock adjustment can be updated");
        }

        Warehouse warehouse = warehouseRepository.findById(dto.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));

        adjust.setWarehouse(warehouse);
        adjust.setAdjustDate(dto.getAdjustDate() != null ? dto.getAdjustDate() : LocalDate.now());
        adjust.setReason(dto.getReason());
        adjust.setNote(dto.getNote());

        adjustItemRepository.deleteByAdjustmentId(adjust.getId());
        for (StockAdjustmentRequestDTO.StockAdjustmentItemRequestDTO itemDto : dto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            int systemQty = productRepository.calculateOnHandByWarehouseAndProductId(
                    warehouse.getId(), product.getId());
            int actualQty = systemQty + itemDto.getAdjustQty();
            if (actualQty < 0) {
                throw new RuntimeException("Adjustment results in negative actual stock for: " + product.getSku());
            }

            StockAdjustmentItem item = StockAdjustmentItem.builder()
                    .adjustment(adjust)
                    .product(product)
                    .systemQty(systemQty)
                    .actualQty(actualQty)
                    .diffQty(itemDto.getAdjustQty())
                    .unitCostSnapshot(product.getAvgCost())
                    .build();

            adjustItemRepository.save(item);
        }

        adjustRepository.save(adjust);
        return getAdjustmentDetailById(adjust.getId());
    }

    @Override
    @Transactional
    public StockAdjustmentDetailResponseDTO completeAdjustment(Long id) {
        StockAdjustment adjust = getStockAdjustmentEntityById(id);

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
        return getAdjustmentDetailById(adjust.getId());
    }

    private void validateItemList(List<StockAdjustmentRequestDTO.StockAdjustmentItemRequestDTO> items) {
        if (items == null || items.isEmpty()) {
            throw new RuntimeException("Stock adjustment items are required");
        }
    }
}
