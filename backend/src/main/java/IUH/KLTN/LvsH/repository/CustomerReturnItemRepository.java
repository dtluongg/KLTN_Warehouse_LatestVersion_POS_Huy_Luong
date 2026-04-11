package IUH.KLTN.LvsH.repository;

import IUH.KLTN.LvsH.entity.CustomerReturnItem;
import IUH.KLTN.LvsH.enums.DocumentStatus;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface CustomerReturnItemRepository extends JpaRepository<CustomerReturnItem, Long> {
	List<CustomerReturnItem> findByCustomerReturnId(Long customerReturnId);
	void deleteByCustomerReturnId(Long customerReturnId);

	@Query("""
		SELECT COALESCE(SUM(i.qty), 0)
		FROM CustomerReturnItem i
		JOIN i.customerReturn cr
		WHERE i.orderItem.id = :orderItemId
		  AND cr.status = :status
	""")
	Integer sumQtyByOrderItemIdAndReturnStatus(@Param("orderItemId") Long orderItemId,
	                                           @Param("status") DocumentStatus status);

	@Query("""
		SELECT COALESCE(SUM(i.qty), 0)
		FROM CustomerReturnItem i
		JOIN i.customerReturn cr
		WHERE i.orderItem.id = :orderItemId
		  AND cr.status = :status
		  AND cr.id <> :excludedReturnId
	""")
	Integer sumQtyByOrderItemIdAndReturnStatusExcludingReturnId(@Param("orderItemId") Long orderItemId,
	                                                            @Param("status") DocumentStatus status,
	                                                            @Param("excludedReturnId") Long excludedReturnId);

	@Query("""
		SELECT COALESCE(SUM(i.refundAmount), 0)
		FROM CustomerReturnItem i
		JOIN i.customerReturn cr
		WHERE i.orderItem.id = :orderItemId
		  AND cr.status = :status
	""")
	BigDecimal sumRefundByOrderItemIdAndReturnStatus(@Param("orderItemId") Long orderItemId,
	                                                 @Param("status") DocumentStatus status);

	@Query("""
		SELECT COALESCE(SUM(i.refundAmount), 0)
		FROM CustomerReturnItem i
		JOIN i.customerReturn cr
		WHERE i.orderItem.id = :orderItemId
		  AND cr.status = :status
		  AND cr.id <> :excludedReturnId
	""")
	BigDecimal sumRefundByOrderItemIdAndReturnStatusExcludingReturnId(@Param("orderItemId") Long orderItemId,
	                                                                  @Param("status") DocumentStatus status,
	                                                                  @Param("excludedReturnId") Long excludedReturnId);
}
