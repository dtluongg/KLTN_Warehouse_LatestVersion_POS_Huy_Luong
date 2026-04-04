package IUH.KLTN.LvsH.backend_refactor.repository;

import IUH.KLTN.LvsH.backend_refactor.entity.SupplierReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SupplierReturnRepository extends JpaRepository<SupplierReturn, Long> {
	@Query("SELECT s.returnNo FROM SupplierReturn s WHERE s.id = :id")
	String findReturnNoById(@Param("id") Long id);
}
