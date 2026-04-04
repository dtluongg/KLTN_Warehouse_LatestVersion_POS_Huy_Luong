package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.entity.Customer;
import java.util.List;
import java.util.UUID;

public interface CustomerService {
    List<Customer> getAllCustomers();
    Customer getCustomerById(UUID id);
    Customer createCustomer(Customer customer);
    Customer updateCustomer(UUID id, Customer customer);
    void deleteCustomer(UUID id);
}
