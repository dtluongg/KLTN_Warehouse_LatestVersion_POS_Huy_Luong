package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.entity.Product;
import IUH.KLTN.LvsH.repository.ProductRepository;
import IUH.KLTN.LvsH.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;

    @Override
    public List<Product> getAllProducts() {
        return productRepository.findByDeletedAtIsNull();
    }

    @Override
    public List<ProductRepository.ProductStockByWarehouseProjection> getStockByWarehouse(Long warehouseId) {
        return productRepository.findStockByWarehouseId(warehouseId);
    }

    @Override
    public Product getProductById(Long id) {
        return productRepository.findByIdAndDeletedAtIsNull(id)
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
        
        // KhÃƒÂ´ng cho phÃƒÂ©p user cÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t trÃ¡Â»Â±c tiÃ¡ÂºÂ¿p `avgCost` qua HTTP body
        // product.setAvgCost(...) 
        
        if(productDetails.getCategory() != null) {
            product.setCategory(productDetails.getCategory());
        }

        return productRepository.save(product);
    }

    @Override
    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        product.setDeletedAt(LocalDateTime.now());
        productRepository.save(product);
    }
}
