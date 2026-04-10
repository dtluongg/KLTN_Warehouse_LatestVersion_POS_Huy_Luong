package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.dto.product.ProductRequestDTO;
import IUH.KLTN.LvsH.dto.product.ProductResponseDTO;
import IUH.KLTN.LvsH.dto.product.ProductSearchCriteria;
import IUH.KLTN.LvsH.entity.Category;
import IUH.KLTN.LvsH.entity.Product;
import IUH.KLTN.LvsH.repository.CategoryRepository;
import IUH.KLTN.LvsH.repository.ProductRepository;
import IUH.KLTN.LvsH.repository.specification.ProductSpecification;
import IUH.KLTN.LvsH.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public Page<ProductResponseDTO> getAllProducts(ProductSearchCriteria criteria, Pageable pageable) {
        Specification<Product> spec = ProductSpecification.withCriteria(criteria);
        Page<Product> page = productRepository.findAll(spec, pageable);
        return page.map(this::toResponseDTO);
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
    public ProductResponseDTO getProductDetailById(Long id) {
        return toResponseDTO(getProductById(id));
    }

    @Override
    public ProductResponseDTO createProduct(ProductRequestDTO request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        Product product = new Product();
        product.setSku(request.getSku());
        product.setBarcode(request.getBarcode());
        product.setName(request.getName());
        product.setShortName(request.getShortName());
        product.setCategory(category);
        product.setSalePrice(request.getSalePrice());
        product.setVatRate(request.getVatRate() != null ? request.getVatRate() : BigDecimal.ZERO);
        product.setImageUrl(request.getImageUrl());
        product.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);

        return toResponseDTO(productRepository.save(product));
    }

    @Override
    public ProductResponseDTO updateProduct(Long id, ProductRequestDTO request) {
        Product product = getProductById(id);
        
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        product.setSku(request.getSku());
        product.setBarcode(request.getBarcode());
        product.setName(request.getName());
        product.setShortName(request.getShortName());
        product.setCategory(category);
        product.setSalePrice(request.getSalePrice());
        product.setVatRate(request.getVatRate());
        product.setImageUrl(request.getImageUrl());
        
        if (request.getIsActive() != null) {
            product.setIsActive(request.getIsActive());
        }

        return toResponseDTO(productRepository.save(product));
    }

    @Override
    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        product.setDeletedAt(LocalDateTime.now());
        productRepository.save(product);
    }

    private ProductResponseDTO toResponseDTO(Product product) {
        return ProductResponseDTO.builder()
                .id(product.getId())
                .sku(product.getSku())
                .barcode(product.getBarcode())
                .name(product.getName())
                .shortName(product.getShortName())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .salePrice(product.getSalePrice())
                .avgCost(product.getAvgCost())
                .lastPurchaseCost(product.getLastPurchaseCost())
                .vatRate(product.getVatRate())
                .imageUrl(product.getImageUrl())
                .isActive(product.getIsActive())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}
