package IUH.KLTN.LvsH.backend_refactor.repository;

import IUH.KLTN.LvsH.backend_refactor.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
	List<OrderItem> findByOrderId(Long orderId);

	interface DailyRevenueProfitProjection {
		LocalDate getReportDate();
		Long getOrdersCount();
		BigDecimal getRevenue();
		BigDecimal getProfit();
	}

	interface TopSellingProductProjection {
		Long getProductId();
		String getSku();
		String getProductName();
		Long getSoldQty();
		BigDecimal getRevenue();
		BigDecimal getProfit();
	}

	@Query(value = """
			SELECT
				DATE(o.order_time) AS "reportDate",
				COUNT(DISTINCT o.id) AS "ordersCount",
				COALESCE(SUM(oi.line_revenue), 0) AS "revenue",
				COALESCE(SUM(oi.line_profit), 0) AS "profit"
			FROM orders o
			JOIN order_items oi ON oi.order_id = o.id
			WHERE o.status = 'POSTED'
			  AND o.order_time >= :fromTime
			  AND o.order_time < :toTime
			  AND (:warehouseId IS NULL OR o.warehouse_id = :warehouseId)
			GROUP BY DATE(o.order_time)
			ORDER BY DATE(o.order_time)
			""", nativeQuery = true)
	List<DailyRevenueProfitProjection> getDailyRevenueProfit(
			@Param("warehouseId") Long warehouseId,
			@Param("fromTime") LocalDateTime fromTime,
			@Param("toTime") LocalDateTime toTime);

	@Query(value = """
			SELECT
				oi.product_id AS "productId",
				p.sku AS "sku",
				p.name AS "productName",
				COALESCE(SUM(oi.qty), 0) AS "soldQty",
				COALESCE(SUM(oi.line_revenue), 0) AS "revenue",
				COALESCE(SUM(oi.line_profit), 0) AS "profit"
			FROM order_items oi
			JOIN orders o ON o.id = oi.order_id
			JOIN products p ON p.id = oi.product_id
			WHERE o.status = 'POSTED'
			  AND o.order_time >= :fromTime
			  AND o.order_time < :toTime
			  AND (:warehouseId IS NULL OR o.warehouse_id = :warehouseId)
			GROUP BY oi.product_id, p.sku, p.name
			ORDER BY "soldQty" DESC, p.name
			LIMIT :topN
			""", nativeQuery = true)
	List<TopSellingProductProjection> getTopSellingProducts(
			@Param("warehouseId") Long warehouseId,
			@Param("fromTime") LocalDateTime fromTime,
			@Param("toTime") LocalDateTime toTime,
			@Param("topN") Integer topN);
}
