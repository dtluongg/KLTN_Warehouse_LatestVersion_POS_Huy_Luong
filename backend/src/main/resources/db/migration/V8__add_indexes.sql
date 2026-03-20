-- Inventory Movements Constraints & Indexes
ALTER TABLE inventory_movements ADD CONSTRAINT uq_inv_mov_ref UNIQUE (ref_table, ref_id, product_id);
CREATE INDEX idx_inv_mov_prod_date ON inventory_movements(product_id, created_at);
CREATE INDEX idx_inv_mov_ref ON inventory_movements(ref_table, ref_id);

-- Reporting & Search Indexes
CREATE INDEX idx_orders_date ON orders(order_time);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
