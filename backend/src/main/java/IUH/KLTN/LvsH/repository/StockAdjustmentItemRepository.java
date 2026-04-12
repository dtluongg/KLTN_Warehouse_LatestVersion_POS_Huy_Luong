package IUH.KLTN.LvsH.repository;

import IUH.KLTN.LvsH.enums.DocumentStatus;
import IUH.KLTN.LvsH.entity.StockAdjustmentItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Repository
public interface StockAdjustmentItemRepository extends JpaRepository<StockAdjustmentItem, Long> {
	List<StockAdjustmentItem> findByAdjustmentId(Long adjustmentId);
	void deleteByAdjustmentId(Long adjustmentId);

	@Query("""
			SELECT DISTINCT sai.product.id
			FROM StockAdjustmentItem sai
			JOIN sai.adjustment sa
			WHERE sa.warehouse.id = :warehouseId
			  AND sa.adjustDate = :adjustDate
			  AND sa.status <> :excludedStatus
			  AND sai.product.id IN :productIds
			  AND (:excludeAdjustmentId IS NULL OR sa.id <> :excludeAdjustmentId)
			""")
	List<Long> findDuplicateProductIdsByWarehouseAndDate(
			@Param("warehouseId") Long warehouseId,
			@Param("adjustDate") LocalDate adjustDate,
			@Param("productIds") Set<Long> productIds,
			@Param("excludedStatus") DocumentStatus excludedStatus,
			@Param("excludeAdjustmentId") Long excludeAdjustmentId);
}
