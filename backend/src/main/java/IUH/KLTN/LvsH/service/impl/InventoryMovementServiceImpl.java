package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.entity.InventoryMovement;
import IUH.KLTN.LvsH.repository.InventoryMovementRepository;
import IUH.KLTN.LvsH.service.InventoryMovementService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryMovementServiceImpl implements InventoryMovementService {

    private final InventoryMovementRepository movementRepository;

    @Override
    public List<InventoryMovement> getAllMovements() {
        return movementRepository.findAll();
    }

    @Override
    public InventoryMovement getMovementById(Long id) {
        return movementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory Movement not found: " + id));
    }
}
