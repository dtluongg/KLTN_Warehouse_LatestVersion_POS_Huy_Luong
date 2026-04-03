package com.pos.service;

import com.pos.dto.SupplierReturnRequestDTO;
import com.pos.dto.SupplierReturnResponseDTO;
import com.pos.entity.SupplierReturn;
import java.util.List;

public interface SupplierReturnService {
    List<SupplierReturn> getAllSupplierReturns();
    SupplierReturn getSupplierReturnById(Long id);
    SupplierReturnResponseDTO createSupplierReturn(SupplierReturnRequestDTO dto);
    SupplierReturnResponseDTO updateDraftSupplierReturn(Long id, SupplierReturnRequestDTO dto);
    SupplierReturnResponseDTO completeSupplierReturn(Long id);
}
