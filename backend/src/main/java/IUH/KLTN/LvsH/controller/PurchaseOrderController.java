package IUH.KLTN.LvsH.controller;

import IUH.KLTN.LvsH.dto.purchase_order.*;
import IUH.KLTN.LvsH.enums.PurchaseOrderClosedReason;
import IUH.KLTN.LvsH.service.PurchaseOrderService;
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
@RequestMapping("/api/purchase-orders")
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final PurchaseOrderService poService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<Page<PurchaseOrderListResponseDTO>> getAllPurchaseOrders(
            PurchaseOrderSearchCriteria criteria,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
            
        Sort sort = direction.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(poService.getAllPurchaseOrders(criteria, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<PurchaseOrderDetailResponseDTO> getPurchaseOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(poService.getPurchaseOrderDetailById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<PurchaseOrderDetailResponseDTO> createPurchaseOrder(@Valid @RequestBody PurchaseOrderRequestDTO request) {
        return ResponseEntity.ok(poService.createPurchaseOrder(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<PurchaseOrderDetailResponseDTO> updateDraftPurchaseOrder(
            @PathVariable Long id, 
            @Valid @RequestBody PurchaseOrderRequestDTO request) {
        return ResponseEntity.ok(poService.updateDraftPurchaseOrder(id, request));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<PurchaseOrderDetailResponseDTO> updateStatus(
            @PathVariable Long id, 
            @RequestParam String status) {
        return ResponseEntity.ok(poService.updateStatus(id, status));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<PurchaseOrderDetailResponseDTO> closePurchaseOrder(
            @PathVariable Long id,
            @RequestParam String reason) {
        try {
            PurchaseOrderClosedReason closeReason = PurchaseOrderClosedReason.valueOf(reason.trim().toUpperCase());
            return ResponseEntity.ok(poService.closePurchaseOrder(id, closeReason));
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Invalid close reason: " + reason);
        }
    }
}
