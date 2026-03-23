-- Inventory Movements Indexes
CREATE INDEX idx_inv_mov_prod_date ON inventory_movements(product_id, created_at);
CREATE INDEX idx_inv_mov_ref ON inventory_movements(ref_table, ref_id);
CREATE INDEX idx_inv_mov_warehouse_product ON inventory_movements(warehouse_id, product_id);
CREATE INDEX idx_inv_balance_product ON inventory_balance(product_id);

-- Reporting & Search Indexes
CREATE INDEX idx_orders_date ON orders(order_time);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
