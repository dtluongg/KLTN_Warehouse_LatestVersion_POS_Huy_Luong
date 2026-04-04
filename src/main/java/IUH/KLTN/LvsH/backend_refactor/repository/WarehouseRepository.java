package IUH.KLTN.LvsH.backend_refactor.repository;

import IUH.KLTN.LvsH.backend_refactor.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {
	List<Warehouse> findByDeletedAtIsNull();

	java.util.Optional<Warehouse> findByIdAndDeletedAtIsNull(Long id);
}
