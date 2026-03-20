CREATE TABLE inventory_movements (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(id) NOT NULL,
    warehouse_id BIGINT REFERENCES warehouse(id) NOT NULL,
    movement_type VARCHAR(50) NOT NULL, 
    qty INT NOT NULL,
    ref_table VARCHAR(50) NOT NULL,
    ref_id VARCHAR(50) NOT NULL,
    note TEXT,
    created_by BIGINT REFERENCES staff(id) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE OR REPLACE FUNCTION update_inventory_on_hand()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.movement_type IN ('PURCHASE_IN', 'RETURN_IN', 'TRANSFER_IN', 'CONVERSION_IN', 'ADJUST_IN') THEN
        UPDATE products SET on_hand = on_hand + NEW.qty WHERE id = NEW.product_id;
    ELSIF NEW.movement_type IN ('SALE_OUT', 'RETURN_OUT', 'TRANSFER_OUT', 'CONVERSION_OUT', 'ADJUST_OUT') THEN
        UPDATE products SET on_hand = on_hand - NEW.qty WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;



-- ================================================================================
-- 3. TRIGGER FUNCTION: apply_inventory_stock_on_movement_ins()
-- ================================================================================
CREATE OR REPLACE FUNCTION apply_inventory_stock_on_movement_ins()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.movement_type IN ('SALE_OUT', 'RETURN_OUT', 'TRANSFER_OUT', 'CONVERSION_OUT', 'ADJUST_OUT') THEN
    UPDATE products SET on_hand = on_hand - NEW.qty WHERE id = NEW.product_id;
  ELSE
    UPDATE products SET on_hand = on_hand + NEW.qty WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END $$;

-- ================================================================================
-- 4. TRIGGER FUNCTION: apply_inventory_stock_on_movement_upd()
-- ================================================================================
CREATE OR REPLACE FUNCTION apply_inventory_stock_on_movement_upd()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Bước 1: Hoàn nguyên stock theo OLD
  IF OLD.movement_type IN ('SALE_OUT', 'RETURN_OUT', 'TRANSFER_OUT', 'CONVERSION_OUT', 'ADJUST_OUT') THEN
    UPDATE products SET on_hand = on_hand + OLD.qty WHERE id = OLD.product_id;
  ELSE
    UPDATE products SET on_hand = on_hand - OLD.qty WHERE id = OLD.product_id;
  END IF;
  
  -- Bước 2: Áp dụng stock theo NEW
  IF NEW.movement_type IN ('SALE_OUT', 'RETURN_OUT', 'TRANSFER_OUT', 'CONVERSION_OUT', 'ADJUST_OUT') THEN
    UPDATE products SET on_hand = on_hand - NEW.qty WHERE id = NEW.product_id;
  ELSE
    UPDATE products SET on_hand = on_hand + NEW.qty WHERE id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END $$;

-- ================================================================================
-- 5. TRIGGER FUNCTION: apply_inventory_stock_on_movement_del()
-- ================================================================================
CREATE OR REPLACE FUNCTION apply_inventory_stock_on_movement_del()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.movement_type IN ('SALE_OUT', 'RETURN_OUT', 'TRANSFER_OUT', 'CONVERSION_OUT', 'ADJUST_OUT') THEN
    UPDATE products SET on_hand = on_hand + OLD.qty WHERE id = OLD.product_id;
  ELSE
    UPDATE products SET on_hand = on_hand - OLD.qty WHERE id = OLD.product_id;
  END IF;
  RETURN OLD;
END $$;

-- ================================================================================
-- 6. ĐĂNG KÝ TRIGGERS CHO INVENTORY_MOVEMENTS
-- ================================================================================
DROP TRIGGER IF EXISTS trg_movements_after_ins ON inventory_movements;
CREATE TRIGGER trg_movements_after_ins
AFTER INSERT ON inventory_movements
FOR EACH ROW EXECUTE FUNCTION apply_inventory_stock_on_movement_ins();

DROP TRIGGER IF EXISTS trg_movements_after_upd ON inventory_movements;
CREATE TRIGGER trg_movements_after_upd
AFTER UPDATE ON inventory_movements
FOR EACH ROW EXECUTE FUNCTION apply_inventory_stock_on_movement_upd();

DROP TRIGGER IF EXISTS trg_movements_after_del ON inventory_movements;
CREATE TRIGGER trg_movements_after_del
AFTER DELETE ON inventory_movements
FOR EACH ROW EXECUTE FUNCTION apply_inventory_stock_on_movement_del();


