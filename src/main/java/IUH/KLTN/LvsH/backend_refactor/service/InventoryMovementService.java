package IUH.KLTN.LvsH.backend_refactor.service;

import IUH.KLTN.LvsH.backend_refactor.entity.InventoryMovement;
import java.util.List;

public interface InventoryMovementService {
    List<InventoryMovement> getAllMovements();
    InventoryMovement getMovementById(Long id);
}
