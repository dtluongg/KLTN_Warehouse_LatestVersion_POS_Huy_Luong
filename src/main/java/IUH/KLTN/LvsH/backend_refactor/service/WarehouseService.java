package IUH.KLTN.LvsH.backend_refactor.service;

import IUH.KLTN.LvsH.backend_refactor.entity.Warehouse;
import java.util.List;

public interface WarehouseService {
    List<Warehouse> getAllWarehouses();
    Warehouse getWarehouseById(Long id);
    Warehouse createWarehouse(Warehouse warehouse);
    Warehouse updateWarehouse(Long id, Warehouse warehouse);
    void deleteWarehouse(Long id);
}
