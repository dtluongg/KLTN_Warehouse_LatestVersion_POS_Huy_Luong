package com.pos.controller;

import com.pos.dto.CreateSupplierReturnDto;
import com.pos.entity.SupplierReturn;
import com.pos.service.SupplierReturnService;
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
    public ResponseEntity<SupplierReturn> createReturn(@RequestBody CreateSupplierReturnDto dto) {
        return ResponseEntity.ok(srService.createSupplierReturn(dto));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<SupplierReturn> completeReturn(@PathVariable Long id) {
        return ResponseEntity.ok(srService.completeSupplierReturn(id));
    }
}
