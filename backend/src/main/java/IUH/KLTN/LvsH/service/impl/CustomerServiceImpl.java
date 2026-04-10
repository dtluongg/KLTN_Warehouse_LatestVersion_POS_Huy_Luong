package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.dto.customer.*;
import IUH.KLTN.LvsH.entity.Customer;
import IUH.KLTN.LvsH.repository.CustomerRepository;
import IUH.KLTN.LvsH.repository.specification.CustomerSpecification;
import IUH.KLTN.LvsH.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;

    @Override
    public Page<CustomerResponseDTO> getAllCustomers(CustomerSearchCriteria criteria, Pageable pageable) {
        Page<Customer> page = customerRepository.findAll(CustomerSpecification.withCriteria(criteria), pageable);
        return page.map(this::toResponseDTO);
    }

    private Customer getCustomerById(UUID id) {
        return customerRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + id));
    }

    @Override
    public CustomerResponseDTO getCustomerDetailById(UUID id) {
        return toResponseDTO(getCustomerById(id));
    }

    @Override
    public CustomerResponseDTO createCustomer(CustomerRequestDTO request) {
        Customer customer = Customer.builder()
                .customerCode(request.getCustomerCode())
                .name(request.getName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .taxCode(request.getTaxCode())
                .address(request.getAddress())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
        return toResponseDTO(customerRepository.save(customer));
    }

    @Override
    public CustomerResponseDTO updateCustomer(UUID id, CustomerRequestDTO request) {
        Customer customer = getCustomerById(id);
        customer.setCustomerCode(request.getCustomerCode());
        customer.setName(request.getName());
        customer.setPhone(request.getPhone());
        customer.setEmail(request.getEmail());
        customer.setTaxCode(request.getTaxCode());
        customer.setAddress(request.getAddress());
        if(request.getIsActive() != null) {
            customer.setIsActive(request.getIsActive());
        }
        return toResponseDTO(customerRepository.save(customer));
    }

    @Override
    public void deleteCustomer(UUID id) {
        Customer customer = getCustomerById(id);
        customer.setDeletedAt(LocalDateTime.now());
        customerRepository.save(customer);
    }

    private CustomerResponseDTO toResponseDTO(Customer customer) {
        return CustomerResponseDTO.builder()
                .id(customer.getId())
                .customerCode(customer.getCustomerCode())
                .name(customer.getName())
                .phone(customer.getPhone())
                .email(customer.getEmail())
                .taxCode(customer.getTaxCode())
                .address(customer.getAddress())
                .isActive(customer.getIsActive())
                .createdAt(customer.getCreatedAt())
                .build();
    }
}
