package IUH.KLTN.LvsH.backend_refactor.controller;

import IUH.KLTN.LvsH.backend_refactor.dto.SupplierReturnRequestDTO;
import IUH.KLTN.LvsH.backend_refactor.dto.SupplierReturnResponseDTO;
import IUH.KLTN.LvsH.backend_refactor.entity.SupplierReturn;
import IUH.KLTN.LvsH.backend_refactor.service.SupplierReturnService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/supplier-returns")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
public class SupplierReturnController {

    private final SupplierReturnService srService;

    @GetMapping
    public ResponseEntity<List<SupplierReturn>> getAllReturns() {
        return ResponseEntity.ok(srService.getAllSupplierReturns());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SupplierReturn> getReturnById(@PathVariable Long id) {
        return ResponseEntity.ok(srService.getSupplierReturnById(id));
    }

    @PostMapping
    public ResponseEntity<SupplierReturnResponseDTO> createReturn(@RequestBody SupplierReturnRequestDTO dto) {
        return ResponseEntity.ok(srService.createSupplierReturn(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SupplierReturnResponseDTO> updateDraftReturn(@PathVariable Long id,
                                                                        @RequestBody SupplierReturnRequestDTO dto) {
        return ResponseEntity.ok(srService.updateDraftSupplierReturn(id, dto));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<SupplierReturnResponseDTO> completeReturn(@PathVariable Long id) {
        return ResponseEntity.ok(srService.completeSupplierReturn(id));
    }
}
