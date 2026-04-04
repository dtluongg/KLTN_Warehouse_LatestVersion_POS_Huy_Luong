package IUH.KLTN.LvsH.backend_refactor.repository;

import IUH.KLTN.LvsH.backend_refactor.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

	List<Product> findByDeletedAtIsNull();

	java.util.Optional<Product> findByIdAndDeletedAtIsNull(Long id);

	interface ProductStockByWarehouseProjection {
		Long getId();
		String getSku();
		String getBarcode();
		String getName();
		String getShortName();
		Long getCategoryId();
		java.math.BigDecimal getSalePrice();
		java.math.BigDecimal getAvgCost();
		Integer getOnHand();
		String getImageUrl();
	}

	interface LowStockProjection {
		Long getWarehouseId();
		Long getProductId();
		String getSku();
		String getProductName();
		Integer getOnHand();
	}

	@Query(value = """
			SELECT
				p.id AS id,
				p.sku AS sku,
				p.barcode AS barcode,
				p.name AS name,
				p.short_name AS \"shortName\",
				p.category_id AS \"categoryId\",
				p.sale_price AS \"salePrice\",
				p.avg_cost AS \"avgCost\",
				COALESCE(ib.on_hand, 0) AS \"onHand\",
				p.image_url AS \"imageUrl\"
			FROM products p
			LEFT JOIN inventory_balance ib
				ON ib.product_id = p.id
			   AND ib.warehouse_id = :warehouseId
			WHERE p.deleted_at IS NULL
			  AND p.is_active = TRUE
			ORDER BY p.name
			""", nativeQuery = true)
	List<ProductStockByWarehouseProjection> findStockByWarehouseId(@Param("warehouseId") Long warehouseId);

	@Query(value = """
			SELECT
				ib.warehouse_id AS "warehouseId",
				p.id AS "productId",
				p.sku AS "sku",
				p.name AS "productName",
				COALESCE(ib.on_hand, 0) AS "onHand"
			FROM inventory_balance ib
			JOIN products p ON p.id = ib.product_id
			WHERE ib.warehouse_id = :warehouseId
			  AND p.deleted_at IS NULL
			  AND p.is_active = TRUE
			  AND COALESCE(ib.on_hand, 0) <= :threshold
			ORDER BY COALESCE(ib.on_hand, 0), p.name
			""", nativeQuery = true)
	List<LowStockProjection> findLowStockByWarehouseId(
			@Param("warehouseId") Long warehouseId,
			@Param("threshold") Integer threshold);

	@Query(value = """
			SELECT COALESCE(SUM(ib.on_hand), 0)
			FROM inventory_balance ib
			WHERE ib.product_id = :productId
			""", nativeQuery = true)
	Integer calculateGlobalOnHandByProductId(@Param("productId") Long productId);

	@Query(value = """
			SELECT COALESCE(ib.on_hand, 0)
			FROM inventory_balance ib
			WHERE ib.product_id = :productId
			  AND ib.warehouse_id = :warehouseId
			""", nativeQuery = true)
	Integer calculateOnHandByWarehouseAndProductId(@Param("warehouseId") Long warehouseId,
												   @Param("productId") Long productId);
}
