package IUH.KLTN.LvsH.repository;

import IUH.KLTN.LvsH.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, Long>, JpaSpecificationExecutor<Warehouse> {
	List<Warehouse> findByDeletedAtIsNull();

	java.util.Optional<Warehouse> findByIdAndDeletedAtIsNull(Long id);
}
