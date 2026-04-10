package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.dto.customer_return.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CustomerReturnService {
    Page<CustomerReturnListResponseDTO> getAllCustomerReturns(CustomerReturnSearchCriteria criteria, Pageable pageable);
    CustomerReturnDetailResponseDTO getCustomerReturnDetailById(Long id);
    CustomerReturnDetailResponseDTO createCustomerReturn(CustomerReturnRequestDTO request);
    CustomerReturnDetailResponseDTO updateDraftCustomerReturn(Long id, CustomerReturnRequestDTO request);
    CustomerReturnDetailResponseDTO completeCustomerReturn(Long id);
}
