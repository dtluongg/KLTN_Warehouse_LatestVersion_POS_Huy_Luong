package IUH.KLTN.LvsH.repository;

import IUH.KLTN.LvsH.entity.SupplierReturnItem;
import IUH.KLTN.LvsH.enums.DocumentStatus;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface SupplierReturnItemRepository extends JpaRepository<SupplierReturnItem, Long> {
	List<SupplierReturnItem> findBySupplierReturnId(Long supplierReturnId);
	void deleteBySupplierReturnId(Long supplierReturnId);

	@Query("""
		SELECT COALESCE(SUM(i.qty), 0)
		FROM SupplierReturnItem i
		JOIN i.supplierReturn sr
		WHERE i.goodsReceiptItem.id = :goodsReceiptItemId
		  AND sr.status = :status
	""")
	Integer sumQtyByGoodsReceiptItemIdAndReturnStatus(@Param("goodsReceiptItemId") Long goodsReceiptItemId,
	                                                 @Param("status") DocumentStatus status);

	@Query("""
		SELECT COALESCE(SUM(i.qty), 0)
		FROM SupplierReturnItem i
		JOIN i.supplierReturn sr
		WHERE i.goodsReceiptItem.id = :goodsReceiptItemId
		  AND sr.status = :status
		  AND sr.id <> :excludedReturnId
	""")
	Integer sumQtyByGoodsReceiptItemIdAndReturnStatusExcludingReturnId(@Param("goodsReceiptItemId") Long goodsReceiptItemId,
	                                                                   @Param("status") DocumentStatus status,
	                                                                   @Param("excludedReturnId") Long excludedReturnId);

	@Query("""
		SELECT COALESCE(SUM(i.returnAmount), 0)
		FROM SupplierReturnItem i
		JOIN i.supplierReturn sr
		WHERE i.goodsReceiptItem.id = :goodsReceiptItemId
		  AND sr.status = :status
	""")
	BigDecimal sumAmountByGoodsReceiptItemIdAndReturnStatus(@Param("goodsReceiptItemId") Long goodsReceiptItemId,
	                                                        @Param("status") DocumentStatus status);

	@Query("""
		SELECT COALESCE(SUM(i.returnAmount), 0)
		FROM SupplierReturnItem i
		JOIN i.supplierReturn sr
		WHERE i.goodsReceiptItem.id = :goodsReceiptItemId
		  AND sr.status = :status
		  AND sr.id <> :excludedReturnId
	""")
	BigDecimal sumAmountByGoodsReceiptItemIdAndReturnStatusExcludingReturnId(@Param("goodsReceiptItemId") Long goodsReceiptItemId,
	                                                                         @Param("status") DocumentStatus status,
	                                                                         @Param("excludedReturnId") Long excludedReturnId);
}
