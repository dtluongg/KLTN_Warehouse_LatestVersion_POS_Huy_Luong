package IUH.KLTN.LvsH.repository;

import IUH.KLTN.LvsH.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long>, JpaSpecificationExecutor<Staff> {
    Optional<Staff> findByUsername(String username);
    Optional<Staff> findByUsernameAndDeletedAtIsNull(String username);
    List<Staff> findByDeletedAtIsNull();
    Optional<Staff> findByIdAndDeletedAtIsNull(Long id);
    boolean existsByUsernameAndIdNot(String username, Long id);
}
