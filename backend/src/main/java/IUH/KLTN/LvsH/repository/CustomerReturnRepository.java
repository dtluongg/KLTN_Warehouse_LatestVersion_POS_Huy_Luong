package IUH.KLTN.LvsH.repository;

import IUH.KLTN.LvsH.entity.CustomerReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerReturnRepository
                extends JpaRepository<CustomerReturn, Long>, JpaSpecificationExecutor<CustomerReturn> {
        @Query("SELECT c.returnNo FROM CustomerReturn c WHERE c.id = :id")
        String findReturnNoById(@Param("id") Long id);

        @Query(value = """
                SELECT COALESCE(SUM(c.total_refund), 0)
                FROM customer_returns c
                WHERE c.status = 'POSTED'
                  AND (:warehouseId IS NULL OR c.warehouse_id = :warehouseId)
                  AND c.created_at >= :fromTime
                  AND c.created_at <= :toTime
                """, nativeQuery = true)
        java.math.BigDecimal sumRefundAmountInPeriod(
                @Param("warehouseId") Long warehouseId,
                @Param("fromTime") java.time.LocalDateTime fromTime,
                @Param("toTime") java.time.LocalDateTime toTime);
}
