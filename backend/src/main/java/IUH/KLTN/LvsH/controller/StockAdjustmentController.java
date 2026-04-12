package IUH.KLTN.LvsH.controller;

import IUH.KLTN.LvsH.dto.stock_adjustment.*;
import IUH.KLTN.LvsH.service.StockAdjustmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stock-adjustments")
@RequiredArgsConstructor
public class StockAdjustmentController {

    private final StockAdjustmentService adjustService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<Page<StockAdjustmentListResponseDTO>> getAllAdjustments(
            StockAdjustmentSearchCriteria criteria,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
            
        Sort sort = direction.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(adjustService.getAllAdjustments(criteria, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<StockAdjustmentDetailResponseDTO> getAdjustmentById(@PathVariable Long id) {
        return ResponseEntity.ok(adjustService.getAdjustmentDetailById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<StockAdjustmentDetailResponseDTO> createAdjustment(@Valid @RequestBody StockAdjustmentRequestDTO request) {
        return ResponseEntity.ok(adjustService.createAdjustment(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<StockAdjustmentDetailResponseDTO> updateDraftAdjustment(
            @PathVariable Long id, 
            @Valid @RequestBody StockAdjustmentRequestDTO request) {
        return ResponseEntity.ok(adjustService.updateDraftAdjustment(id, request));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StockAdjustmentDetailResponseDTO> completeAdjustment(
            @PathVariable Long id,
            // true = still post by saved diff even when stock changed after counting
            @RequestParam(defaultValue = "false") boolean forceCompleteWhenDrift) {
        return ResponseEntity.ok(adjustService.completeAdjustment(id, forceCompleteWhenDrift));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<StockAdjustmentDetailResponseDTO> cancelDraftAdjustment(@PathVariable Long id) {
        return ResponseEntity.ok(adjustService.cancelDraftAdjustment(id));
    }
}
