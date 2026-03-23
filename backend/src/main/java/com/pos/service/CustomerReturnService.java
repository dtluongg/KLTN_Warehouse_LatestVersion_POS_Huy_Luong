package com.pos.service;

import com.pos.dto.CreateCustomerReturnDto;
import com.pos.dto.CustomerReturnResponseDTO;
import com.pos.entity.CustomerReturn;

import java.util.List;

public interface CustomerReturnService {
    List<CustomerReturn> getAllCustomerReturns();
    CustomerReturn getCustomerReturnById(Long id);
    CustomerReturnResponseDTO createCustomerReturn(CreateCustomerReturnDto dto);
    CustomerReturnResponseDTO completeCustomerReturn(Long id);
}
