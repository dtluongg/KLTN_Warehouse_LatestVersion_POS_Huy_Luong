package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.entity.Customer;
import IUH.KLTN.LvsH.repository.CustomerRepository;
import IUH.KLTN.LvsH.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;

    @Override
    public List<Customer> getAllCustomers() {
        return customerRepository.findByDeletedAtIsNull();
    }

    @Override
    public Customer getCustomerById(UUID id) {
        return customerRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
    }

    @Override
    public Customer createCustomer(Customer customer) {
        return customerRepository.save(customer);
    }

    @Override
    public Customer updateCustomer(UUID id, Customer customerDetails) {
        Customer customer = getCustomerById(id);
        customer.setCustomerCode(customerDetails.getCustomerCode());
        customer.setName(customerDetails.getName());
        customer.setPhone(customerDetails.getPhone());
        customer.setEmail(customerDetails.getEmail());
        customer.setTaxCode(customerDetails.getTaxCode());
        customer.setAddress(customerDetails.getAddress());
        customer.setIsActive(customerDetails.getIsActive());
        return customerRepository.save(customer);
    }

    @Override
    public void deleteCustomer(UUID id) {
        Customer customer = getCustomerById(id);
        customer.setDeletedAt(LocalDateTime.now());
        customerRepository.save(customer);
    }
}
