package com.pos.repository;

import com.pos.entity.GoodsReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface GoodsReceiptRepository extends JpaRepository<GoodsReceipt, Long> {
    @Query("SELECT g.grNo FROM GoodsReceipt g WHERE g.id = :id")
    String findGrNoById(@Param("id") Long id);
}
