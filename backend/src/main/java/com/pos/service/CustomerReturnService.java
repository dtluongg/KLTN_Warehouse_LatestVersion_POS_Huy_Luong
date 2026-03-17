package com.pos.service;

import com.pos.dto.CreateCustomerReturnDto;
import com.pos.entity.CustomerReturn;

import java.util.List;

public interface CustomerReturnService {
    List<CustomerReturn> getAllCustomerReturns();
    CustomerReturn getCustomerReturnById(Long id);
    CustomerReturn createCustomerReturn(CreateCustomerReturnDto dto);
    CustomerReturn completeCustomerReturn(Long id);
}
