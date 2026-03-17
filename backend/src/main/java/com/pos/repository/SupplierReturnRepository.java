package com.pos.repository;

import com.pos.entity.SupplierReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SupplierReturnRepository extends JpaRepository<SupplierReturn, Long> {
}
