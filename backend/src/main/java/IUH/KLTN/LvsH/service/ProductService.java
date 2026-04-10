package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.dto.product.ProductRequestDTO;
import IUH.KLTN.LvsH.dto.product.ProductResponseDTO;
import IUH.KLTN.LvsH.dto.product.ProductSearchCriteria;
import IUH.KLTN.LvsH.entity.Product;
import IUH.KLTN.LvsH.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface ProductService {
    Page<ProductResponseDTO> getAllProducts(ProductSearchCriteria criteria, Pageable pageable);
    List<ProductRepository.ProductStockByWarehouseProjection> getStockByWarehouse(Long warehouseId);
    ProductResponseDTO getProductDetailById(Long id);
    ProductResponseDTO createProduct(ProductRequestDTO request);
    ProductResponseDTO updateProduct(Long id, ProductRequestDTO request);
    void deleteProduct(Long id);
    
    // Internal method
    Product getProductById(Long id);
}
