package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.dto.CustomerReturnRequestDTO;
import IUH.KLTN.LvsH.dto.CustomerReturnResponseDTO;
import IUH.KLTN.LvsH.entity.CustomerReturn;

import java.util.List;

public interface CustomerReturnService {
    List<CustomerReturn> getAllCustomerReturns();
    CustomerReturn getCustomerReturnById(Long id);
    CustomerReturnResponseDTO createCustomerReturn(CustomerReturnRequestDTO dto);
    CustomerReturnResponseDTO updateDraftCustomerReturn(Long id, CustomerReturnRequestDTO dto);
    CustomerReturnResponseDTO completeCustomerReturn(Long id);
}
