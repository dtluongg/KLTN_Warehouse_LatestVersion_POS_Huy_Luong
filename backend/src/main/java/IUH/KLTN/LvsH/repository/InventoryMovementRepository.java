package IUH.KLTN.LvsH.repository;

import IUH.KLTN.LvsH.entity.InventoryMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long>, JpaSpecificationExecutor<InventoryMovement> {

	interface StockMovementPeriodProjection {
		Long getWarehouseId();
		Long getProductId();
		String getProductSku();
		String getProductName();
		Integer getOpeningQty();
		Integer getInQty();
		Integer getOutQty();
		Integer getClosingQty();
	}

	@Query(value = """
			WITH movement AS (
				SELECT
					im.warehouse_id,
					im.product_id,
					CASE
						WHEN im.movement_type IN ('PURCHASE_IN', 'RETURN_IN', 'TRANSFER_IN', 'CONVERSION_IN', 'ADJUST_IN')
							THEN im.qty
						ELSE -im.qty
					END AS signed_qty,
					CASE
						WHEN im.movement_type IN ('PURCHASE_IN', 'RETURN_IN', 'TRANSFER_IN', 'CONVERSION_IN', 'ADJUST_IN')
							THEN im.qty
						ELSE 0
					END AS in_qty,
					CASE
						WHEN im.movement_type IN ('SALE_OUT', 'RETURN_OUT', 'TRANSFER_OUT', 'CONVERSION_OUT', 'ADJUST_OUT')
							THEN im.qty
						ELSE 0
					END AS out_qty,
					im.created_at
				FROM inventory_movements im
				WHERE (:warehouseId IS NULL OR im.warehouse_id = :warehouseId)
			)
			SELECT
				m.warehouse_id AS "warehouseId",
				m.product_id AS "productId",
				p.sku AS "productSku",
				p.name AS "productName",
				COALESCE(SUM(CASE WHEN m.created_at < :fromTime THEN m.signed_qty ELSE 0 END), 0) AS "openingQty",
				COALESCE(SUM(CASE WHEN m.created_at >= :fromTime AND m.created_at < :toTime THEN m.in_qty ELSE 0 END), 0) AS "inQty",
				COALESCE(SUM(CASE WHEN m.created_at >= :fromTime AND m.created_at < :toTime THEN m.out_qty ELSE 0 END), 0) AS "outQty",
				COALESCE(SUM(CASE WHEN m.created_at < :toTime THEN m.signed_qty ELSE 0 END), 0) AS "closingQty"
			FROM movement m
			JOIN products p ON p.id = m.product_id
			GROUP BY m.warehouse_id, m.product_id, p.sku, p.name
			HAVING COALESCE(SUM(CASE WHEN m.created_at >= :fromTime AND m.created_at < :toTime THEN (m.in_qty + m.out_qty) ELSE 0 END), 0) > 0
			ORDER BY p.name
			""", nativeQuery = true)
	List<StockMovementPeriodProjection> getStockMovementByPeriod(
			@Param("warehouseId") Long warehouseId,
			@Param("fromTime") LocalDateTime fromTime,
			@Param("toTime") LocalDateTime toTime);
}
