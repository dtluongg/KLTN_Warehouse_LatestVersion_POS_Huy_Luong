package com.pos.repository;

import com.pos.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

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
			WHERE p.is_active = TRUE
			ORDER BY p.name
			""", nativeQuery = true)
	List<ProductStockByWarehouseProjection> findStockByWarehouseId(@Param("warehouseId") Long warehouseId);

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
