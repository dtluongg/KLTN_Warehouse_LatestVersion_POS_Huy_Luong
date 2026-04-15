package IUH.KLTN.LvsH.repository;

import IUH.KLTN.LvsH.entity.GoodsReceiptItem;
import IUH.KLTN.LvsH.enums.DocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoodsReceiptItemRepository extends JpaRepository<GoodsReceiptItem, Long> {
	interface PoItemReceivedQtyProjection {
		Long getPoItemId();
		Integer getReceivedQty();
	}

	List<GoodsReceiptItem> findByGoodsReceiptId(Long goodsReceiptId);
	void deleteByGoodsReceiptId(Long goodsReceiptId);

	@Query("""
			SELECT COALESCE(SUM(gri.receivedQty), 0)
			FROM GoodsReceiptItem gri
			JOIN gri.goodsReceipt gr
			WHERE gri.purchaseOrderItem.id = :poItemId
			  AND gr.status = :status
			""")
	Integer sumReceivedQtyByPurchaseOrderItemIdAndReceiptStatus(@Param("poItemId") Long poItemId,
	                                                          @Param("status") DocumentStatus status);

	@Query("""
			SELECT COALESCE(SUM(gri.receivedQty), 0)
			FROM GoodsReceiptItem gri
			JOIN gri.goodsReceipt gr
			WHERE gri.purchaseOrderItem.id = :poItemId
			  AND gr.status = :status
			  AND gr.id <> :excludedGoodsReceiptId
			""")
	Integer sumReceivedQtyByPurchaseOrderItemIdAndReceiptStatusExcludingGoodsReceiptId(@Param("poItemId") Long poItemId,
	                                                                                 @Param("status") DocumentStatus status,
	                                                                                 @Param("excludedGoodsReceiptId") Long excludedGoodsReceiptId);

	@Query("""
			SELECT gri.purchaseOrderItem.id AS poItemId,
			       COALESCE(SUM(gri.receivedQty), 0) AS receivedQty
			FROM GoodsReceiptItem gri
			JOIN gri.goodsReceipt gr
			WHERE gri.purchaseOrderItem.purchaseOrder.id = :purchaseOrderId
			  AND gr.status = :status
			GROUP BY gri.purchaseOrderItem.id
			""")
	List<PoItemReceivedQtyProjection> sumReceivedQtyByPurchaseOrderIdAndReceiptStatus(@Param("purchaseOrderId") Long purchaseOrderId,
	                                                                                 @Param("status") DocumentStatus status);
}
