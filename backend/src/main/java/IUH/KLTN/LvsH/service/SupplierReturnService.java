package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.dto.supplier_return.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface SupplierReturnService {
    Page<SupplierReturnListResponseDTO> getAllSupplierReturns(SupplierReturnSearchCriteria criteria, Pageable pageable);
    SupplierReturnDetailResponseDTO getSupplierReturnDetailById(Long id);
    SupplierReturnDetailResponseDTO createSupplierReturn(SupplierReturnRequestDTO request);
    SupplierReturnDetailResponseDTO updateDraftSupplierReturn(Long id, SupplierReturnRequestDTO request);
    SupplierReturnDetailResponseDTO completeSupplierReturn(Long id);
    SupplierReturnDetailResponseDTO cancelDraftSupplierReturn(Long id);
}
