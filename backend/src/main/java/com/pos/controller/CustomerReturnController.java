package com.pos.controller;

import com.pos.dto.CustomerReturnRequestDTO;
import com.pos.dto.CustomerReturnResponseDTO;
import com.pos.entity.CustomerReturn;
import com.pos.service.CustomerReturnService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customer-returns")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF', 'WAREHOUSE_STAFF')")
public class CustomerReturnController {

    private final CustomerReturnService returnService;

    @GetMapping
    public ResponseEntity<List<CustomerReturn>> getAllReturns() {
        return ResponseEntity.ok(returnService.getAllCustomerReturns());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerReturn> getReturnById(@PathVariable Long id) {
        return ResponseEntity.ok(returnService.getCustomerReturnById(id));
    }

    @PostMapping
    public ResponseEntity<CustomerReturnResponseDTO> createReturn(@RequestBody CustomerReturnRequestDTO dto) {
        return ResponseEntity.ok(returnService.createCustomerReturn(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomerReturnResponseDTO> updateDraftReturn(@PathVariable Long id,
                                                                        @RequestBody CustomerReturnRequestDTO dto) {
        return ResponseEntity.ok(returnService.updateDraftCustomerReturn(id, dto));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<CustomerReturnResponseDTO> completeReturn(@PathVariable Long id) {
        return ResponseEntity.ok(returnService.completeCustomerReturn(id));
    }
}
