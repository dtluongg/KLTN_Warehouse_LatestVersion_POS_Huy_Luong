package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.entity.Supplier;
import java.util.List;
import java.util.UUID;

public interface SupplierService {
    List<Supplier> getAllSuppliers();
    Supplier getSupplierById(UUID id);
    Supplier createSupplier(Supplier supplier);
    Supplier updateSupplier(UUID id, Supplier supplier);
    void deleteSupplier(UUID id);
}
