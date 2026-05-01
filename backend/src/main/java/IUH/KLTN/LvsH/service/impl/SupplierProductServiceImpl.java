package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.dto.supplier_product.SupplierProductRequestDTO;
import IUH.KLTN.LvsH.dto.supplier_product.SupplierProductResponseDTO;
import IUH.KLTN.LvsH.entity.Product;
import IUH.KLTN.LvsH.entity.Supplier;
import IUH.KLTN.LvsH.entity.SupplierProduct;
import IUH.KLTN.LvsH.repository.ProductRepository;
import IUH.KLTN.LvsH.repository.SupplierProductRepository;
import IUH.KLTN.LvsH.repository.SupplierRepository;
import IUH.KLTN.LvsH.service.SupplierProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SupplierProductServiceImpl implements SupplierProductService {

    private final SupplierProductRepository supplierProductRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SupplierProductResponseDTO> getProductsBySupplier(UUID supplierId) {
        supplierRepository.findById(supplierId)
                .orElseThrow(() -> new RuntimeException("Nhà cung cấp không tồn tại"));

        return supplierProductRepository.findBySupplierIdAndIsActiveTrue(supplierId)
                .stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupplierProductResponseDTO> getSuppliersByProduct(Long productId) {
        productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại"));

        return supplierProductRepository.findByProductIdAndIsActiveTrue(productId)
                .stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SupplierProductResponseDTO create(SupplierProductRequestDTO request) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new RuntimeException("Nhà cung cấp không tồn tại"));
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại"));

        // Kiểm tra đã tồn tại chưa
        Optional<SupplierProduct> existing = supplierProductRepository
                .findBySupplierIdAndProductId(supplier.getId(), product.getId());

        if (existing.isPresent()) {
            // Nếu đã tồn tại nhưng bị inactive → kích hoạt lại và cập nhật giá
            SupplierProduct sp = existing.get();
            if (!Boolean.TRUE.equals(sp.getIsActive())) {
                sp.setIsActive(true);
                sp.setStandardPrice(request.getStandardPrice());
                sp.setLastUpdatedAt(LocalDateTime.now());
                return toResponseDTO(supplierProductRepository.save(sp));
            }
            throw new RuntimeException("Sản phẩm '" + product.getName() +
                    "' đã có trong bảng giá của nhà cung cấp '" + supplier.getName() + "'");
        }

        SupplierProduct sp = SupplierProduct.builder()
                .supplier(supplier)
                .product(product)
                .standardPrice(request.getStandardPrice())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .lastUpdatedAt(LocalDateTime.now())
                .build();

        return toResponseDTO(supplierProductRepository.save(sp));
    }

    @Override
    @Transactional
    public SupplierProductResponseDTO update(Long id, SupplierProductRequestDTO request) {
        SupplierProduct sp = supplierProductRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bản ghi bảng giá NCC không tồn tại"));

        sp.setStandardPrice(request.getStandardPrice());
        if (request.getIsActive() != null) {
            sp.setIsActive(request.getIsActive());
        }
        sp.setLastUpdatedAt(LocalDateTime.now());

        return toResponseDTO(supplierProductRepository.save(sp));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        SupplierProduct sp = supplierProductRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bản ghi bảng giá NCC không tồn tại"));
        supplierProductRepository.delete(sp);
    }

    private SupplierProductResponseDTO toResponseDTO(SupplierProduct sp) {
        return SupplierProductResponseDTO.builder()
                .id(sp.getId())
                .supplierId(sp.getSupplier().getId())
                .supplierName(sp.getSupplier().getName())
                .productId(sp.getProduct().getId())
                .productSku(sp.getProduct().getSku())
                .productName(sp.getProduct().getName())
                .vatRate(sp.getProduct().getVatRate())
                .standardPrice(sp.getStandardPrice())
                .isActive(sp.getIsActive())
                .lastUpdatedAt(sp.getLastUpdatedAt())
                .createdAt(sp.getCreatedAt())
                .build();
    }
}
