package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.dto.supplier.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.UUID;

public interface SupplierService {
    Page<SupplierResponseDTO> getAllSuppliers(SupplierSearchCriteria criteria, Pageable pageable);
    SupplierResponseDTO getSupplierDetailById(UUID id);
    SupplierResponseDTO createSupplier(SupplierRequestDTO request);
    SupplierResponseDTO updateSupplier(UUID id, SupplierRequestDTO request);
    void deleteSupplier(UUID id);
}
