package IUH.KLTN.LvsH.controller;

import IUH.KLTN.LvsH.dto.goods_receipt.*;
import IUH.KLTN.LvsH.service.GoodsReceiptService;
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
@RequestMapping("/api/goods-receipts")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
public class GoodsReceiptController {

    private final GoodsReceiptService grService;

    @GetMapping
    public ResponseEntity<Page<GoodsReceiptListResponseDTO>> getAllReceipts(
            GoodsReceiptSearchCriteria criteria,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        
        Sort sort = direction.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        return ResponseEntity.ok(grService.getAllGoodsReceipts(criteria, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GoodsReceiptDetailResponseDTO> getReceiptById(@PathVariable Long id) {
        return ResponseEntity.ok(grService.getGoodsReceiptDetailById(id));
    }

    @PostMapping
    public ResponseEntity<GoodsReceiptDetailResponseDTO> createReceipt(@Valid @RequestBody GoodsReceiptRequestDTO dto) {
        return ResponseEntity.ok(grService.createGoodsReceipt(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GoodsReceiptDetailResponseDTO> updateDraftReceipt(@PathVariable Long id,
                                                                       @Valid @RequestBody GoodsReceiptRequestDTO dto) {
        return ResponseEntity.ok(grService.updateDraftGoodsReceipt(id, dto));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<GoodsReceiptDetailResponseDTO> completeReceipt(@PathVariable Long id) {
        return ResponseEntity.ok(grService.completeGoodsReceipt(id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<GoodsReceiptDetailResponseDTO> cancelReceipt(@PathVariable Long id) {
        return ResponseEntity.ok(grService.cancelGoodsReceipt(id));
    }
}
