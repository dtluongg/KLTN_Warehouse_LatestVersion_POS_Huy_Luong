package IUH.KLTN.LvsH.repository;

import IUH.KLTN.LvsH.entity.SupplierReturnItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplierReturnItemRepository extends JpaRepository<SupplierReturnItem, Long> {
	List<SupplierReturnItem> findBySupplierReturnId(Long supplierReturnId);
	void deleteBySupplierReturnId(Long supplierReturnId);
}
