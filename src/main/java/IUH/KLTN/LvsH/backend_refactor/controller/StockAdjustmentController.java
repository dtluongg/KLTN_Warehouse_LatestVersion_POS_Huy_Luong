package IUH.KLTN.LvsH.backend_refactor.controller;

import IUH.KLTN.LvsH.backend_refactor.dto.StockAdjustmentRequestDTO;
import IUH.KLTN.LvsH.backend_refactor.dto.StockAdjustmentResponseDTO;
import IUH.KLTN.LvsH.backend_refactor.entity.StockAdjustment;
import IUH.KLTN.LvsH.backend_refactor.service.StockAdjustmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stock-adjustments")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
public class StockAdjustmentController {

    private final StockAdjustmentService adjustService;

    @GetMapping
    public ResponseEntity<List<StockAdjustment>> getAllAdjustments() {
        return ResponseEntity.ok(adjustService.getAllAdjustments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StockAdjustment> getAdjustmentById(@PathVariable Long id) {
        return ResponseEntity.ok(adjustService.getAdjustmentById(id));
    }

    @PostMapping
    public ResponseEntity<StockAdjustmentResponseDTO> createAdjustment(@RequestBody StockAdjustmentRequestDTO dto) {
        return ResponseEntity.ok(adjustService.createAdjustment(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StockAdjustmentResponseDTO> updateDraftAdjustment(@PathVariable Long id,
                                                                             @RequestBody StockAdjustmentRequestDTO dto) {
        return ResponseEntity.ok(adjustService.updateDraftAdjustment(id, dto));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<StockAdjustmentResponseDTO> completeAdjustment(@PathVariable Long id) {
        return ResponseEntity.ok(adjustService.completeAdjustment(id));
    }
}
