package IUH.KLTN.LvsH.backend_refactor.repository;

import IUH.KLTN.LvsH.backend_refactor.entity.CustomerReturnItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerReturnItemRepository extends JpaRepository<CustomerReturnItem, Long> {
	List<CustomerReturnItem> findByCustomerReturnId(Long customerReturnId);
	void deleteByCustomerReturnId(Long customerReturnId);
}
