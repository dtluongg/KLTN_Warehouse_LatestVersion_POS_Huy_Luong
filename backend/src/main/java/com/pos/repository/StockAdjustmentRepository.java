package com.pos.repository;

import com.pos.entity.StockAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface StockAdjustmentRepository extends JpaRepository<StockAdjustment, Long> {
    @Query("SELECT s.adjustNo FROM StockAdjustment s WHERE s.id = :id")
    String findAdjustNoById(@Param("id") Long id);
}
