package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.dto.supplier_product.SupplierProductRequestDTO;
import IUH.KLTN.LvsH.dto.supplier_product.SupplierProductResponseDTO;

import java.util.List;
import java.util.UUID;

public interface SupplierProductService {
    // Lấy danh sách SP mà 1 NCC cung cấp (active)
    List<SupplierProductResponseDTO> getProductsBySupplier(UUID supplierId);

    // Lấy danh sách NCC cung cấp 1 SP (active)
    List<SupplierProductResponseDTO> getSuppliersByProduct(Long productId);

    // Thêm SP vào bảng giá NCC
    SupplierProductResponseDTO create(SupplierProductRequestDTO request);

    // Cập nhật giá / trạng thái
    SupplierProductResponseDTO update(Long id, SupplierProductRequestDTO request);

    // Xóa SP khỏi bảng giá NCC
    void delete(Long id);
}
