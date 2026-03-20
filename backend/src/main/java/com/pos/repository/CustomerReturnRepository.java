package com.pos.repository;

import com.pos.entity.CustomerReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerReturnRepository extends JpaRepository<CustomerReturn, Long> {
    @Query("SELECT c.returnNo FROM CustomerReturn c WHERE c.id = :id")
    String findReturnNoById(@Param("id") Long id);
}
