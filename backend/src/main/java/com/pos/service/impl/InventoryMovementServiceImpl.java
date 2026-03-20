package com.pos.service.impl;

import com.pos.entity.InventoryMovement;
import com.pos.repository.InventoryMovementRepository;
import com.pos.service.InventoryMovementService;
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
