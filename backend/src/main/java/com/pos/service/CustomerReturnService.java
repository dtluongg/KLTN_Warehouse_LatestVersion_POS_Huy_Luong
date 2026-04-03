package com.pos.service;

import com.pos.dto.CustomerReturnRequestDTO;
import com.pos.dto.CustomerReturnResponseDTO;
import com.pos.entity.CustomerReturn;

import java.util.List;

public interface CustomerReturnService {
    List<CustomerReturn> getAllCustomerReturns();
    CustomerReturn getCustomerReturnById(Long id);
    CustomerReturnResponseDTO createCustomerReturn(CustomerReturnRequestDTO dto);
    CustomerReturnResponseDTO updateDraftCustomerReturn(Long id, CustomerReturnRequestDTO dto);
    CustomerReturnResponseDTO completeCustomerReturn(Long id);
}
