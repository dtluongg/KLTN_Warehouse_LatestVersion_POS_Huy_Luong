package IUH.KLTN.LvsH.backend_refactor.service;

import IUH.KLTN.LvsH.backend_refactor.dto.CustomerReturnRequestDTO;
import IUH.KLTN.LvsH.backend_refactor.dto.CustomerReturnResponseDTO;
import IUH.KLTN.LvsH.backend_refactor.entity.CustomerReturn;

import java.util.List;

public interface CustomerReturnService {
    List<CustomerReturn> getAllCustomerReturns();
    CustomerReturn getCustomerReturnById(Long id);
    CustomerReturnResponseDTO createCustomerReturn(CustomerReturnRequestDTO dto);
    CustomerReturnResponseDTO updateDraftCustomerReturn(Long id, CustomerReturnRequestDTO dto);
    CustomerReturnResponseDTO completeCustomerReturn(Long id);
}
