package IUH.KLTN.LvsH.controller;

import IUH.KLTN.LvsH.dto.SupplierReturnRequestDTO;
import IUH.KLTN.LvsH.dto.SupplierReturnResponseDTO;
import IUH.KLTN.LvsH.entity.SupplierReturn;
import IUH.KLTN.LvsH.service.SupplierReturnService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;

import jakarta.validation.Valid;
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
    public ResponseEntity<SupplierReturnResponseDTO> createReturn(@Valid @RequestBody SupplierReturnRequestDTO dto) {
        return ResponseEntity.ok(srService.createSupplierReturn(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SupplierReturnResponseDTO> updateDraftReturn(@PathVariable Long id,
                                                                        @Valid @RequestBody SupplierReturnRequestDTO dto) {
        return ResponseEntity.ok(srService.updateDraftSupplierReturn(id, dto));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<SupplierReturnResponseDTO> completeReturn(@PathVariable Long id) {
        return ResponseEntity.ok(srService.completeSupplierReturn(id));
    }
}
