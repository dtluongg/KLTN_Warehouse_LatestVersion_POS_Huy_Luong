package com.pos.service;

import com.pos.entity.Product;
import com.pos.repository.ProductRepository;
import java.util.List;

public interface ProductService {
    List<Product> getAllProducts();
    List<ProductRepository.ProductStockByWarehouseProjection> getStockByWarehouse(Long warehouseId);
    Product getProductById(Long id);
    Product createProduct(Product product);
    Product updateProduct(Long id, Product product);
    void deleteProduct(Long id);
}
