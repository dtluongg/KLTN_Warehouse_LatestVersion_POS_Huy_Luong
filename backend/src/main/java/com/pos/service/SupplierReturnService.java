package com.pos.service;

import com.pos.dto.CreateSupplierReturnDto;
import com.pos.dto.SupplierReturnResponseDTO;
import com.pos.entity.SupplierReturn;
import java.util.List;

public interface SupplierReturnService {
    List<SupplierReturn> getAllSupplierReturns();
    SupplierReturn getSupplierReturnById(Long id);
    SupplierReturnResponseDTO createSupplierReturn(CreateSupplierReturnDto dto);
    SupplierReturnResponseDTO completeSupplierReturn(Long id);
}
