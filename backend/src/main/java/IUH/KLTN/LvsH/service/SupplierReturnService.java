package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.dto.SupplierReturnRequestDTO;
import IUH.KLTN.LvsH.dto.SupplierReturnResponseDTO;
import IUH.KLTN.LvsH.entity.SupplierReturn;
import java.util.List;

public interface SupplierReturnService {
    List<SupplierReturn> getAllSupplierReturns();
    SupplierReturn getSupplierReturnById(Long id);
    SupplierReturnResponseDTO createSupplierReturn(SupplierReturnRequestDTO dto);
    SupplierReturnResponseDTO updateDraftSupplierReturn(Long id, SupplierReturnRequestDTO dto);
    SupplierReturnResponseDTO completeSupplierReturn(Long id);
}
