package com.pos.service;

import com.pos.dto.CreateSupplierReturnDto;
import com.pos.entity.SupplierReturn;
import java.util.List;

public interface SupplierReturnService {
    List<SupplierReturn> getAllSupplierReturns();
    SupplierReturn getSupplierReturnById(Long id);
    SupplierReturn createSupplierReturn(CreateSupplierReturnDto dto);
    SupplierReturn completeSupplierReturn(Long id);
}
