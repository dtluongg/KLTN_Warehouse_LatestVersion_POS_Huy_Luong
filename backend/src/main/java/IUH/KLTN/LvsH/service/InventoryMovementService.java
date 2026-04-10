package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.dto.inventory_movement.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface InventoryMovementService {
    Page<InventoryMovementResponseDTO> getAllMovements(InventoryMovementSearchCriteria criteria, Pageable pageable);
    InventoryMovementResponseDTO getMovementById(Long id);
}
