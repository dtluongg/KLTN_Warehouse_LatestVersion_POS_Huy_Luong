package IUH.KLTN.LvsH.controller;

import IUH.KLTN.LvsH.dto.product.ProductRequestDTO;
import IUH.KLTN.LvsH.dto.product.ProductResponseDTO;
import IUH.KLTN.LvsH.dto.product.ProductSearchCriteria;
import IUH.KLTN.LvsH.repository.ProductRepository;
import IUH.KLTN.LvsH.service.ProductService;
import IUH.KLTN.LvsH.service.ProductExcelService;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
    @GetMapping("/export")
    public ResponseEntity<Resource> exportProducts(IUH.KLTN.LvsH.dto.product.ProductSearchCriteria criteria) {
        InputStreamResource file = new InputStreamResource(productExcelService.exportProductsToExcel(criteria));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=products.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(file);
    }

    @GetMapping("/export/template")
    public ResponseEntity<Resource> downloadTemplate() {
        InputStreamResource file = new InputStreamResource(productExcelService.downloadTemplate());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=product_template.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(file);
    }

    @PostMapping("/import")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<Map<String, Object>> importProducts(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, Object> result = productExcelService.importProductsFromExcel(file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }


    private final ProductService productService;
    private final ProductExcelService productExcelService;

    @GetMapping
    public ResponseEntity<Page<ProductResponseDTO>> getAllProducts(
            ProductSearchCriteria criteria,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
            
        Sort sort = direction.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(productService.getAllProducts(criteria, pageable));
    }

    @GetMapping("/stock-by-warehouse")
    public ResponseEntity<List<ProductRepository.ProductStockByWarehouseProjection>> getStockByWarehouse(
            @RequestParam Long warehouseId) {
        return ResponseEntity.ok(productService.getStockByWarehouse(warehouseId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponseDTO> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductDetailById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<ProductResponseDTO> createProduct(@Valid @RequestBody ProductRequestDTO request) {
        return ResponseEntity.ok(productService.createProduct(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<ProductResponseDTO> updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequestDTO request) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
}
