package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.dto.warehouse.*;
import IUH.KLTN.LvsH.entity.Warehouse;
import IUH.KLTN.LvsH.repository.WarehouseRepository;
import IUH.KLTN.LvsH.repository.specification.WarehouseSpecification;
import IUH.KLTN.LvsH.service.WarehouseService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class WarehouseServiceImpl implements WarehouseService {

    private final WarehouseRepository warehouseRepository;

    @Override
    public Page<WarehouseResponseDTO> getAllWarehouses(WarehouseSearchCriteria criteria, Pageable pageable) {
        Page<Warehouse> page = warehouseRepository.findAll(WarehouseSpecification.withCriteria(criteria), pageable);
        return page.map(this::toResponseDTO);
    }

    private Warehouse getWarehouseById(Long id) {
        return warehouseRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Warehouse not found: " + id));
    }

    @Override
    public WarehouseResponseDTO getWarehouseDetailById(Long id) {
        return toResponseDTO(getWarehouseById(id));
    }

    @Override
    public WarehouseResponseDTO createWarehouse(WarehouseRequestDTO request) {
        Warehouse warehouse = Warehouse.builder()
                .code(request.getCode())
                .name(request.getName())
                .address(request.getAddress())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
        return toResponseDTO(warehouseRepository.save(warehouse));
    }

    @Override
    public WarehouseResponseDTO updateWarehouse(Long id, WarehouseRequestDTO request) {
        Warehouse warehouse = getWarehouseById(id);
        warehouse.setCode(request.getCode());
        warehouse.setName(request.getName());
        warehouse.setAddress(request.getAddress());
        if(request.getIsActive() != null) {
            warehouse.setIsActive(request.getIsActive());
        }
        return toResponseDTO(warehouseRepository.save(warehouse));
    }

    @Override
    public void deleteWarehouse(Long id) {
        Warehouse warehouse = getWarehouseById(id);
        warehouse.setDeletedAt(LocalDateTime.now());
        warehouseRepository.save(warehouse);
    }

    private WarehouseResponseDTO toResponseDTO(Warehouse warehouse) {
        return WarehouseResponseDTO.builder()
                .id(warehouse.getId())
                .code(warehouse.getCode())
                .name(warehouse.getName())
                .address(warehouse.getAddress())
                .isActive(warehouse.getIsActive())
                .build();
    }
}
