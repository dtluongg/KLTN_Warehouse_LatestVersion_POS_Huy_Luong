package IUH.KLTN.LvsH.backend_refactor.repository;

import IUH.KLTN.LvsH.backend_refactor.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
	List<Category> findByDeletedAtIsNull();

	java.util.Optional<Category> findByIdAndDeletedAtIsNull(Long id);
}
