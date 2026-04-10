package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.dto.inventory_movement.*;
import IUH.KLTN.LvsH.entity.InventoryMovement;
import IUH.KLTN.LvsH.repository.InventoryMovementRepository;
import IUH.KLTN.LvsH.repository.specification.InventoryMovementSpecification;
import IUH.KLTN.LvsH.service.InventoryMovementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class InventoryMovementServiceImpl implements InventoryMovementService {

    private final InventoryMovementRepository movementRepository;

    @Override
    public Page<InventoryMovementResponseDTO> getAllMovements(InventoryMovementSearchCriteria criteria, Pageable pageable) {
        Page<InventoryMovement> page = movementRepository.findAll(InventoryMovementSpecification.withCriteria(criteria), pageable);
        return page.map(m -> InventoryMovementResponseDTO.builder()
                .id(m.getId())
                .productId(m.getProduct().getId())
                .productSku(m.getProduct().getSku())
                .productName(m.getProduct().getName())
                .warehouseId(m.getWarehouse().getId())
                .warehouseName(m.getWarehouse().getName())
                .movementType(m.getMovementType().name())
                .qty(m.getQty())
                .refTable(m.getRefTable())
                .refId(m.getRefId())
                .note(m.getNote())
                .createdBy(m.getCreatedBy().getFullName())
                .createdAt(m.getCreatedAt())
                .build());
    }

    @Override
    public InventoryMovementResponseDTO getMovementById(Long id) {
        InventoryMovement m = movementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory Movement not found: " + id));
        return InventoryMovementResponseDTO.builder()
                .id(m.getId())
                .productId(m.getProduct().getId())
                .productSku(m.getProduct().getSku())
                .productName(m.getProduct().getName())
                .warehouseId(m.getWarehouse().getId())
                .warehouseName(m.getWarehouse().getName())
                .movementType(m.getMovementType().name())
                .qty(m.getQty())
                .refTable(m.getRefTable())
                .refId(m.getRefId())
                .note(m.getNote())
                .createdBy(m.getCreatedBy().getFullName())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
