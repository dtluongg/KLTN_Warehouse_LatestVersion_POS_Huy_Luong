package IUH.KLTN.LvsH.repository;

import IUH.KLTN.LvsH.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, UUID>, JpaSpecificationExecutor<Customer> {
	List<Customer> findByDeletedAtIsNull();

	java.util.Optional<Customer> findByIdAndDeletedAtIsNull(UUID id);
}
