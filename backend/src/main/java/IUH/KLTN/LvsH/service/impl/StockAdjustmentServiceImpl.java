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
import java.util.HashSet;
import java.util.List;
import java.util.Set;
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

    private StockAdjustment getStockAdjustmentEntityByIdForUpdate(Long id) {
        // Acquire DB row lock to serialize complete operation for the same adjustment.
        return adjustRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new RuntimeException("Stock Adjustment not found"));
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
        LocalDate adjustDate = LocalDate.now();

        validateOneCheckPerItemPerDay(dto.getItems(), warehouse.getId(), adjustDate, null);

        StockAdjustment adjust = StockAdjustment.builder()
                .warehouse(warehouse)
            .adjustDate(adjustDate)
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
        LocalDate adjustDate = LocalDate.now();

        validateOneCheckPerItemPerDay(dto.getItems(), warehouse.getId(), adjustDate, adjust.getId());

        adjust.setWarehouse(warehouse);
        // Business rule: adjustment date is always locked to current date.
        adjust.setAdjustDate(adjustDate);
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
    public StockAdjustmentDetailResponseDTO completeAdjustment(Long id, boolean forceCompleteWhenDrift) {
        Staff actor = getAuthenticatedStaff();
        if (actor.getRole() != IUH.KLTN.LvsH.enums.Role.ADMIN) {
            throw new RuntimeException("Only ADMIN can complete stock adjustment");
        }

        // Lock the document first to reduce race condition when multiple users complete together.
        StockAdjustment adjust = getStockAdjustmentEntityByIdForUpdate(id);

        if (adjust.getStatus() == DocumentStatus.CANCELLED) {
            throw new RuntimeException("Cancelled adjustment cannot be completed");
        }
        if (adjust.getStatus() == DocumentStatus.POSTED) {
            throw new RuntimeException("Adjustment already completed");
        }
        
        List<StockAdjustmentItem> items = adjustItemRepository.findByAdjustmentId(adjust.getId());

        // Validate against current stock right before posting movements.
        validateDriftAndNegativePost(items, adjust.getWarehouse().getId(), forceCompleteWhenDrift);

        adjust.setStatus(DocumentStatus.POSTED);
        adjustRepository.save(adjust);

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

    @Override
    @Transactional
    public StockAdjustmentDetailResponseDTO cancelDraftAdjustment(Long id) {
        StockAdjustment adjust = getStockAdjustmentEntityById(id);

        if (adjust.getStatus() == DocumentStatus.POSTED) {
            throw new RuntimeException("Posted stock adjustment cannot be cancelled");
        }
        if (adjust.getStatus() == DocumentStatus.CANCELLED) {
            throw new RuntimeException("Stock adjustment is already cancelled");
        }

        Staff actor = getAuthenticatedStaff();
        if (!adjust.getCreatedBy().getId().equals(actor.getId())) {
            throw new RuntimeException("Only creator can cancel this draft stock adjustment");
        }

        adjust.setStatus(DocumentStatus.CANCELLED);
        adjustRepository.save(adjust);
        return getAdjustmentDetailById(adjust.getId());
    }

    private void validateDriftAndNegativePost(List<StockAdjustmentItem> items, Long warehouseId,
                                              boolean forceCompleteWhenDrift) {
        List<String> driftSkus = new java.util.ArrayList<>();

        for (StockAdjustmentItem item : items) {
            int currentQty = productRepository.calculateOnHandByWarehouseAndProductId(
                    warehouseId, item.getProduct().getId());
            int expectedPostedQty = currentQty + item.getDiffQty();

            // Guardrail: never allow posting that would drive stock below zero.
            if (expectedPostedQty < 0) {
                throw new RuntimeException("Completing adjustment would make stock negative for SKU "
                        + item.getProduct().getSku() + " (current=" + currentQty
                        + ", diff=" + item.getDiffQty() + ")");
            }

            // Drift means stock changed after counting (DRAFT phase had other movements).
            if (!currentQtyEqualsSnapshot(currentQty, item.getSystemQty())) {
                driftSkus.add(item.getProduct().getSku());
            }
        }

        // Require explicit confirmation when drift exists; if forced, apply saved diff as designed.
        if (!driftSkus.isEmpty() && !forceCompleteWhenDrift) {
            throw new RuntimeException("Inventory changed after count for SKU(s): "
                    + String.join(", ", driftSkus)
                    + ". Recount/update draft, or re-complete with forceCompleteWhenDrift=true to apply saved diff.");
        }
    }

    private boolean currentQtyEqualsSnapshot(int currentQty, Integer snapshotQty) {
        return snapshotQty != null && currentQty == snapshotQty;
    }

    private void validateOneCheckPerItemPerDay(
            List<StockAdjustmentRequestDTO.StockAdjustmentItemRequestDTO> items,
            Long warehouseId,
            LocalDate adjustDate,
            Long excludeAdjustmentId) {
        Set<Long> productIds = items.stream()
                .map(StockAdjustmentRequestDTO.StockAdjustmentItemRequestDTO::getProductId)
                .collect(Collectors.toSet());

        List<Long> duplicatedProductIds = adjustItemRepository.findDuplicateProductIdsByWarehouseAndDate(
                warehouseId,
                adjustDate,
                productIds,
                DocumentStatus.CANCELLED,
                excludeAdjustmentId);

        if (!duplicatedProductIds.isEmpty()) {
            List<String> duplicatedProductNames = productRepository.findAllById(duplicatedProductIds).stream()
                .map(product -> product.getName() + " (" + product.getSku() + ")")
                .toList();

            throw new RuntimeException("Sản phẩm đã được kiểm trong ngày ở phiếu khác: "
                + String.join(", ", duplicatedProductNames));
        }
    }

    private void validateItemList(List<StockAdjustmentRequestDTO.StockAdjustmentItemRequestDTO> items) {
        if (items == null || items.isEmpty()) {
            throw new RuntimeException("Stock adjustment items are required");
        }

        Set<Long> productIds = new HashSet<>();
        for (StockAdjustmentRequestDTO.StockAdjustmentItemRequestDTO item : items) {
            if (item.getProductId() == null) {
                throw new RuntimeException("Product is required for each stock adjustment item");
            }
            if (!productIds.add(item.getProductId())) {
                // Prevent duplicated rows for the same product in one adjustment document.
                throw new RuntimeException("Duplicate product in stock adjustment items: " + item.getProductId());
            }
            if (item.getAdjustQty() == null) {
                throw new RuntimeException("adjustQty is required for each stock adjustment item");
            }
            if (item.getAdjustQty() == 0) {
                // Zero-diff lines create noise and should be removed before submit.
                throw new RuntimeException("adjustQty cannot be 0");
            }
        }
    }
}
