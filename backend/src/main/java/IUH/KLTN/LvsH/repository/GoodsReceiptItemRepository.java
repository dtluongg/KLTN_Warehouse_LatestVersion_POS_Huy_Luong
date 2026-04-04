package IUH.KLTN.LvsH.repository;

import IUH.KLTN.LvsH.entity.GoodsReceiptItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoodsReceiptItemRepository extends JpaRepository<GoodsReceiptItem, Long> {
	List<GoodsReceiptItem> findByGoodsReceiptId(Long goodsReceiptId);
	void deleteByGoodsReceiptId(Long goodsReceiptId);
}
