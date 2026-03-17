package com.pos.controller;

import com.pos.dto.CreateGoodsReceiptDto;
import com.pos.entity.GoodsReceipt;
import com.pos.service.GoodsReceiptService;
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
    public ResponseEntity<GoodsReceipt> createReceipt(@RequestBody CreateGoodsReceiptDto dto) {
        return ResponseEntity.ok(grService.createGoodsReceipt(dto));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<GoodsReceipt> completeReceipt(@PathVariable Long id) {
        return ResponseEntity.ok(grService.completeGoodsReceipt(id));
    }
}
