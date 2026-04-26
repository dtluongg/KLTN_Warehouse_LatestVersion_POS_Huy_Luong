package IUH.KLTN.LvsH.repository;

import IUH.KLTN.LvsH.entity.SupplierProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SupplierProductRepository extends JpaRepository<SupplierProduct, Long> {

    // Lấy danh sách SP mà 1 NCC cung cấp (chỉ active)
    List<SupplierProduct> findBySupplierIdAndIsActiveTrue(UUID supplierId);

    // Lấy danh sách SP mà 1 NCC cung cấp (tất cả trạng thái)
    List<SupplierProduct> findBySupplierId(UUID supplierId);

    // Lấy danh sách NCC cung cấp 1 SP (chỉ active)
    List<SupplierProduct> findByProductIdAndIsActiveTrue(Long productId);

    // Lấy danh sách NCC cung cấp 1 SP (tất cả trạng thái)
    List<SupplierProduct> findByProductId(Long productId);

    // Tìm bản ghi theo NCC + SP (active)
    Optional<SupplierProduct> findBySupplierIdAndProductIdAndIsActiveTrue(UUID supplierId, Long productId);

    // Tìm bản ghi theo NCC + SP (bất kỳ trạng thái)
    Optional<SupplierProduct> findBySupplierIdAndProductId(UUID supplierId, Long productId);

    // Kiểm tra SP có thuộc NCC không
    boolean existsBySupplierIdAndProductIdAndIsActiveTrue(UUID supplierId, Long productId);
}
