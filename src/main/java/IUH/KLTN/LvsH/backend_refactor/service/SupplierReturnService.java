package IUH.KLTN.LvsH.backend_refactor.service;

import IUH.KLTN.LvsH.backend_refactor.dto.SupplierReturnRequestDTO;
import IUH.KLTN.LvsH.backend_refactor.dto.SupplierReturnResponseDTO;
import IUH.KLTN.LvsH.backend_refactor.entity.SupplierReturn;
import java.util.List;

public interface SupplierReturnService {
    List<SupplierReturn> getAllSupplierReturns();
    SupplierReturn getSupplierReturnById(Long id);
    SupplierReturnResponseDTO createSupplierReturn(SupplierReturnRequestDTO dto);
    SupplierReturnResponseDTO updateDraftSupplierReturn(Long id, SupplierReturnRequestDTO dto);
    SupplierReturnResponseDTO completeSupplierReturn(Long id);
}
