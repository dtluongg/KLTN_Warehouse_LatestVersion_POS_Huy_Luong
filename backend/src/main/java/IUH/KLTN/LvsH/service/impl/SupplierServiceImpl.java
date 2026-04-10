package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.dto.supplier.*;
import IUH.KLTN.LvsH.entity.Supplier;
import IUH.KLTN.LvsH.repository.SupplierRepository;
import IUH.KLTN.LvsH.repository.specification.SupplierSpecification;
import IUH.KLTN.LvsH.service.SupplierService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;

    @Override
    public Page<SupplierResponseDTO> getAllSuppliers(SupplierSearchCriteria criteria, Pageable pageable) {
        Page<Supplier> page = supplierRepository.findAll(SupplierSpecification.withCriteria(criteria), pageable);
        return page.map(this::toResponseDTO);
    }

    private Supplier getSupplierById(UUID id) {
        return supplierRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found: " + id));
    }

    @Override
    public SupplierResponseDTO getSupplierDetailById(UUID id) {
        return toResponseDTO(getSupplierById(id));
    }

    @Override
    public SupplierResponseDTO createSupplier(SupplierRequestDTO request) {
        Supplier supplier = Supplier.builder()
                .supplierCode(request.getSupplierCode())
                .name(request.getName())
                .phone(request.getPhone())
                .taxCode(request.getTaxCode())
                .address(request.getAddress())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
        return toResponseDTO(supplierRepository.save(supplier));
    }

    @Override
    public SupplierResponseDTO updateSupplier(UUID id, SupplierRequestDTO request) {
        Supplier supplier = getSupplierById(id);
        supplier.setSupplierCode(request.getSupplierCode());
        supplier.setName(request.getName());
        supplier.setPhone(request.getPhone());
        supplier.setTaxCode(request.getTaxCode());
        supplier.setAddress(request.getAddress());
        if(request.getIsActive() != null) {
            supplier.setIsActive(request.getIsActive());
        }
        return toResponseDTO(supplierRepository.save(supplier));
    }

    @Override
    public void deleteSupplier(UUID id) {
        Supplier supplier = getSupplierById(id);
        supplier.setDeletedAt(LocalDateTime.now());
        supplierRepository.save(supplier);
    }

    private SupplierResponseDTO toResponseDTO(Supplier supplier) {
        return SupplierResponseDTO.builder()
                .id(supplier.getId())
                .supplierCode(supplier.getSupplierCode())
                .name(supplier.getName())
                .phone(supplier.getPhone())
                .taxCode(supplier.getTaxCode())
                .address(supplier.getAddress())
                .isActive(supplier.getIsActive())
                .build();
    }
}
