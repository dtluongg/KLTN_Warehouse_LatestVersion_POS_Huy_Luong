package IUH.KLTN.LvsH.backend_refactor.service.impl;

import IUH.KLTN.LvsH.backend_refactor.entity.Warehouse;
import IUH.KLTN.LvsH.backend_refactor.repository.WarehouseRepository;
import IUH.KLTN.LvsH.backend_refactor.service.WarehouseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WarehouseServiceImpl implements WarehouseService {

    private final WarehouseRepository warehouseRepository;

    @Override
    public List<Warehouse> getAllWarehouses() {
        return warehouseRepository.findByDeletedAtIsNull();
    }

    @Override
    public Warehouse getWarehouseById(Long id) {
        return warehouseRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Warehouse not found: " + id));
    }

    @Override
    public Warehouse createWarehouse(Warehouse warehouse) {
        return warehouseRepository.save(warehouse);
    }

    @Override
    public Warehouse updateWarehouse(Long id, Warehouse warehouseDetails) {
        Warehouse warehouse = getWarehouseById(id);
        warehouse.setName(warehouseDetails.getName());
        warehouse.setCode(warehouseDetails.getCode());
        warehouse.setAddress(warehouseDetails.getAddress());
        warehouse.setIsActive(warehouseDetails.getIsActive());
        return warehouseRepository.save(warehouse);
    }

    @Override
    public void deleteWarehouse(Long id) {
        Warehouse warehouse = getWarehouseById(id);
        warehouse.setDeletedAt(LocalDateTime.now());
        warehouseRepository.save(warehouse);
    }
}
