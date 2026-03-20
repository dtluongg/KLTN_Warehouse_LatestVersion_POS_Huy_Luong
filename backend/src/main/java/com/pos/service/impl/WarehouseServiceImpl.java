package com.pos.service.impl;

import com.pos.entity.Warehouse;
import com.pos.repository.WarehouseRepository;
import com.pos.service.WarehouseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WarehouseServiceImpl implements WarehouseService {

    private final WarehouseRepository warehouseRepository;

    @Override
    public List<Warehouse> getAllWarehouses() {
        return warehouseRepository.findAll();
    }

    @Override
    public Warehouse getWarehouseById(Long id) {
        return warehouseRepository.findById(id)
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
}
