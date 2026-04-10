package IUH.KLTN.LvsH.repository;

import IUH.KLTN.LvsH.entity.StockAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StockAdjustmentRepository extends JpaRepository<StockAdjustment, Long>, JpaSpecificationExecutor<StockAdjustment> {
    interface StockAdjustmentSummaryProjection {
        Long getAdjustmentId();
        String getAdjustNo();
        LocalDate getAdjustDate();
        Long getWarehouseId();
        String getWarehouseName();
        String getReason();
        String getStatus();
        Integer getTotalIncreaseQty();
        Integer getTotalDecreaseQty();
        Integer getNetDiffQty();
        java.math.BigDecimal getEstimatedValueImpact();
    }

    @Query("SELECT s.adjustNo FROM StockAdjustment s WHERE s.id = :id")
    String findAdjustNoById(@Param("id") Long id);

    @Query(value = """
            SELECT
                sa.id AS "adjustmentId",
                sa.adjust_no AS "adjustNo",
                sa.adjust_date AS "adjustDate",
                w.id AS "warehouseId",
                w.name AS "warehouseName",
                sa.reason AS "reason",
                sa.status AS "status",
                COALESCE(SUM(CASE WHEN sai.diff_qty > 0 THEN sai.diff_qty ELSE 0 END), 0) AS "totalIncreaseQty",
                COALESCE(SUM(CASE WHEN sai.diff_qty < 0 THEN ABS(sai.diff_qty) ELSE 0 END), 0) AS "totalDecreaseQty",
                COALESCE(SUM(sai.diff_qty), 0) AS "netDiffQty",
                COALESCE(SUM(sai.diff_qty * sai.unit_cost_snapshot), 0) AS "estimatedValueImpact"
            FROM stock_adjustments sa
            JOIN warehouses w ON w.id = sa.warehouse_id
            JOIN stock_adjustment_items sai ON sai.adjustment_id = sa.id
            WHERE sa.adjust_date >= :fromDate
              AND sa.adjust_date <= :toDate
              AND sa.status = 'POSTED'
              AND (:warehouseId IS NULL OR sa.warehouse_id = :warehouseId)
            GROUP BY sa.id, sa.adjust_no, sa.adjust_date, w.id, w.name, sa.reason, sa.status
            ORDER BY sa.adjust_date DESC, sa.id DESC
            """, nativeQuery = true)
    List<StockAdjustmentSummaryProjection> getStockAdjustmentSummary(
            @Param("warehouseId") Long warehouseId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);
}
