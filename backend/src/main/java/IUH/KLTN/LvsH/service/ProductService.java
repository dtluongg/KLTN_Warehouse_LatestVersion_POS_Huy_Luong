package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.entity.Product;
import IUH.KLTN.LvsH.repository.ProductRepository;
import java.util.List;

public interface ProductService {
    List<Product> getAllProducts();
    List<ProductRepository.ProductStockByWarehouseProjection> getStockByWarehouse(Long warehouseId);
    Product getProductById(Long id);
    Product createProduct(Product product);
    Product updateProduct(Long id, Product product);
    void deleteProduct(Long id);
}
