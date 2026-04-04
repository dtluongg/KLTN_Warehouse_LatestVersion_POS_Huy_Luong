package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.entity.InventoryMovement;
import java.util.List;

public interface InventoryMovementService {
    List<InventoryMovement> getAllMovements();
    InventoryMovement getMovementById(Long id);
}
