package com.pos.service.impl;

import com.pos.entity.Supplier;
import com.pos.repository.SupplierRepository;
import com.pos.service.SupplierService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;

    @Override
    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    @Override
    public Supplier getSupplierById(UUID id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
    }

    @Override
    public Supplier createSupplier(Supplier supplier) {
        return supplierRepository.save(supplier);
    }

    @Override
    public Supplier updateSupplier(UUID id, Supplier supplierDetails) {
        Supplier supplier = getSupplierById(id);
        supplier.setSupplierCode(supplierDetails.getSupplierCode());
        supplier.setName(supplierDetails.getName());
        supplier.setPhone(supplierDetails.getPhone());
        supplier.setTaxCode(supplierDetails.getTaxCode());
        supplier.setAddress(supplierDetails.getAddress());
        supplier.setIsActive(supplierDetails.getIsActive());
        return supplierRepository.save(supplier);
    }

    @Override
    public void deleteSupplier(UUID id) {
        Supplier supplier = getSupplierById(id);
        supplierRepository.delete(supplier);
    }
}
