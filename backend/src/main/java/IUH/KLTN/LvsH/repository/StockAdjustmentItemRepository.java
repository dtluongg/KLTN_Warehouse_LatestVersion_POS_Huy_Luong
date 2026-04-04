package IUH.KLTN.LvsH.repository;

import IUH.KLTN.LvsH.entity.StockAdjustmentItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockAdjustmentItemRepository extends JpaRepository<StockAdjustmentItem, Long> {
	List<StockAdjustmentItem> findByAdjustmentId(Long adjustmentId);
	void deleteByAdjustmentId(Long adjustmentId);
}
