package IUH.KLTN.LvsH.backend_refactor.controller;

import IUH.KLTN.LvsH.backend_refactor.dto.GoodsReceiptRequestDTO;
import IUH.KLTN.LvsH.backend_refactor.dto.GoodsReceiptResponseDTO;
import IUH.KLTN.LvsH.backend_refactor.entity.GoodsReceipt;
import IUH.KLTN.LvsH.backend_refactor.service.GoodsReceiptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/goods-receipts")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
public class GoodsReceiptController {

    private final GoodsReceiptService grService;

    @GetMapping
    public ResponseEntity<List<GoodsReceipt>> getAllReceipts() {
        return ResponseEntity.ok(grService.getAllGoodsReceipts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GoodsReceipt> getReceiptById(@PathVariable Long id) {
        return ResponseEntity.ok(grService.getGoodsReceiptById(id));
    }

    @PostMapping
    public ResponseEntity<GoodsReceiptResponseDTO> createReceipt(@RequestBody GoodsReceiptRequestDTO dto) {
        return ResponseEntity.ok(grService.createGoodsReceipt(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GoodsReceiptResponseDTO> updateDraftReceipt(@PathVariable Long id,
                                                                       @RequestBody GoodsReceiptRequestDTO dto) {
        return ResponseEntity.ok(grService.updateDraftGoodsReceipt(id, dto));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<GoodsReceiptResponseDTO> completeReceipt(@PathVariable Long id) {
        return ResponseEntity.ok(grService.completeGoodsReceipt(id));
    }
}
