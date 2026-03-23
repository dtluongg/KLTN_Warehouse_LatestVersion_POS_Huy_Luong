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


-- 2) Inventory balance snapshot table (fast read for POS)
CREATE TABLE inventory_balance (
    warehouse_id BIGINT REFERENCES warehouse(id) NOT NULL,
    product_id BIGINT REFERENCES products(id) NOT NULL,
    on_hand INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (warehouse_id, product_id)
);


-- 3) Trigger function: apply movement delta to inventory_balance on INSERT
CREATE OR REPLACE FUNCTION apply_inventory_balance_on_movement_ins()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    signed_qty INT;
BEGIN
    IF NEW.movement_type IN ('PURCHASE_IN', 'RETURN_IN', 'TRANSFER_IN', 'CONVERSION_IN', 'ADJUST_IN') THEN
        signed_qty := NEW.qty;
    ELSIF NEW.movement_type IN ('SALE_OUT', 'RETURN_OUT', 'TRANSFER_OUT', 'CONVERSION_OUT', 'ADJUST_OUT') THEN
        signed_qty := -NEW.qty;
    ELSE
        signed_qty := 0;
    END IF;

    INSERT INTO inventory_balance (warehouse_id, product_id, on_hand, updated_at)
    VALUES (NEW.warehouse_id, NEW.product_id, signed_qty, CURRENT_TIMESTAMP)
    ON CONFLICT (warehouse_id, product_id)
    DO UPDATE SET
        on_hand = inventory_balance.on_hand + EXCLUDED.on_hand,
        updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_inventory_balance_after_ins ON inventory_movements;
CREATE TRIGGER trg_inventory_balance_after_ins
AFTER INSERT ON inventory_movements
FOR EACH ROW EXECUTE FUNCTION apply_inventory_balance_on_movement_ins();


-- 4) Legacy view removed: stock is now read from inventory_balance directly.




