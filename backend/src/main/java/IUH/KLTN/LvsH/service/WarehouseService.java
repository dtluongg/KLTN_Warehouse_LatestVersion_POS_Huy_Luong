package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.dto.warehouse.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface WarehouseService {
    Page<WarehouseResponseDTO> getAllWarehouses(WarehouseSearchCriteria criteria, Pageable pageable);
    WarehouseResponseDTO getWarehouseDetailById(Long id);
    WarehouseResponseDTO createWarehouse(WarehouseRequestDTO request);
    WarehouseResponseDTO updateWarehouse(Long id, WarehouseRequestDTO request);
    void deleteWarehouse(Long id);
}
