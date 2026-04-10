package IUH.KLTN.LvsH.controller;

import IUH.KLTN.LvsH.dto.supplier_return.*;
import IUH.KLTN.LvsH.service.SupplierReturnService;
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
@RequestMapping("/api/supplier-returns")
@RequiredArgsConstructor
public class SupplierReturnController {

    private final SupplierReturnService returnService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<Page<SupplierReturnListResponseDTO>> getAllSupplierReturns(
            SupplierReturnSearchCriteria criteria,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
            
        Sort sort = direction.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(returnService.getAllSupplierReturns(criteria, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<SupplierReturnDetailResponseDTO> getSupplierReturnById(@PathVariable Long id) {
        return ResponseEntity.ok(returnService.getSupplierReturnDetailById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<SupplierReturnDetailResponseDTO> createSupplierReturn(@Valid @RequestBody SupplierReturnRequestDTO request) {
        return ResponseEntity.ok(returnService.createSupplierReturn(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<SupplierReturnDetailResponseDTO> updateDraftSupplierReturn(
            @PathVariable Long id, 
            @Valid @RequestBody SupplierReturnRequestDTO request) {
        return ResponseEntity.ok(returnService.updateDraftSupplierReturn(id, request));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<SupplierReturnDetailResponseDTO> completeSupplierReturn(@PathVariable Long id) {
        return ResponseEntity.ok(returnService.completeSupplierReturn(id));
    }
}
