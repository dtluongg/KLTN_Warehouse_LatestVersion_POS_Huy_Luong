package IUH.KLTN.LvsH.controller;

import IUH.KLTN.LvsH.dto.supplier_product.SupplierProductRequestDTO;
import IUH.KLTN.LvsH.dto.supplier_product.SupplierProductResponseDTO;
import IUH.KLTN.LvsH.service.SupplierProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/supplier-products")
@RequiredArgsConstructor
public class SupplierProductController {

    private final SupplierProductService supplierProductService;

    // Lấy danh sách SP mà 1 NCC cung cấp (dùng khi tạo PO)
    @GetMapping("/by-supplier/{supplierId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<List<SupplierProductResponseDTO>> getProductsBySupplier(@PathVariable UUID supplierId) {
        return ResponseEntity.ok(supplierProductService.getProductsBySupplier(supplierId));
    }

    // Lấy danh sách NCC cung cấp 1 SP (dùng trong chi tiết SP)
    @GetMapping("/by-product/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<List<SupplierProductResponseDTO>> getSuppliersByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(supplierProductService.getSuppliersByProduct(productId));
    }

    // Thêm SP vào bảng giá NCC
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<SupplierProductResponseDTO> create(@Valid @RequestBody SupplierProductRequestDTO request) {
        return ResponseEntity.ok(supplierProductService.create(request));
    }

    // Cập nhật giá / trạng thái
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<SupplierProductResponseDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody SupplierProductRequestDTO request) {
        return ResponseEntity.ok(supplierProductService.update(id, request));
    }

    // Xóa SP khỏi bảng giá NCC
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        supplierProductService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
