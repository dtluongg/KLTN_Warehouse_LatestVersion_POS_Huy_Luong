package com.pos.service;

import com.pos.entity.InventoryMovement;
import java.util.List;

public interface InventoryMovementService {
    List<InventoryMovement> getAllMovements();
    InventoryMovement getMovementById(Long id);
}
