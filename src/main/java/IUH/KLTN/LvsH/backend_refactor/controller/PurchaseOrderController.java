package IUH.KLTN.LvsH.backend_refactor.controller;

import IUH.KLTN.LvsH.backend_refactor.dto.PurchaseOrderRequestDTO;
import IUH.KLTN.LvsH.backend_refactor.dto.PurchaseOrderResponseDTO;
import IUH.KLTN.LvsH.backend_refactor.entity.PurchaseOrder;
import IUH.KLTN.LvsH.backend_refactor.service.PurchaseOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchase-orders")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
public class PurchaseOrderController {

    private final PurchaseOrderService poService;

    @GetMapping
    public ResponseEntity<List<PurchaseOrder>> getAllPOs() {
        return ResponseEntity.ok(poService.getAllPurchaseOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseOrder> getPOById(@PathVariable Long id) {
        return ResponseEntity.ok(poService.getPurchaseOrderById(id));
    }

    @PostMapping
    public ResponseEntity<PurchaseOrderResponseDTO> createPO(@RequestBody PurchaseOrderRequestDTO dto) {
        return ResponseEntity.ok(poService.createPurchaseOrder(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PurchaseOrderResponseDTO> updateDraftPO(@PathVariable Long id,
                                                                   @RequestBody PurchaseOrderRequestDTO dto) {
        return ResponseEntity.ok(poService.updateDraftPurchaseOrder(id, dto));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<PurchaseOrderResponseDTO> updatePOStatus(@PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(poService.updateStatus(id, status));
    }
}
