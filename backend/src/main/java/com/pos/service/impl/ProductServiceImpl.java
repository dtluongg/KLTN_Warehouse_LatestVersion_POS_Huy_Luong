package com.pos.service.impl;

import com.pos.entity.Product;
import com.pos.repository.ProductRepository;
import com.pos.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;

    @Override
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @Override
    public List<ProductRepository.ProductStockByWarehouseProjection> getStockByWarehouse(Long warehouseId) {
        return productRepository.findStockByWarehouseId(warehouseId);
    }

    @Override
    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    @Override
    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    @Override
    public Product updateProduct(Long id, Product productDetails) {
        Product product = getProductById(id);
        product.setSku(productDetails.getSku());
        product.setBarcode(productDetails.getBarcode());
        product.setName(productDetails.getName());
        product.setShortName(productDetails.getShortName());
        product.setSalePrice(productDetails.getSalePrice());
        product.setVatRate(productDetails.getVatRate());
        product.setIsActive(productDetails.getIsActive());
        
        // Không cho phép user cập nhật trực tiếp `avgCost` qua HTTP body
        // product.setAvgCost(...) 
        
        if(productDetails.getCategory() != null) {
            product.setCategory(productDetails.getCategory());
        }

        return productRepository.save(product);
    }

    @Override
    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        productRepository.delete(product);
    }
}
