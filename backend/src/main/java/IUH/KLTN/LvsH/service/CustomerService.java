package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.dto.customer.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.UUID;

public interface CustomerService {
    Page<CustomerResponseDTO> getAllCustomers(CustomerSearchCriteria criteria, Pageable pageable);
    CustomerResponseDTO getCustomerDetailById(UUID id);
    CustomerResponseDTO createCustomer(CustomerRequestDTO request);
    CustomerResponseDTO updateCustomer(UUID id, CustomerRequestDTO request);
    void deleteCustomer(UUID id);
}
