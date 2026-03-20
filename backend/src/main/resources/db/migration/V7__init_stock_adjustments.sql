CREATE TABLE stock_adjustments (
    id BIGSERIAL PRIMARY KEY,
    adjust_no VARCHAR(50) UNIQUE NOT NULL,
    warehouse_id BIGINT REFERENCES warehouse(id) NOT NULL,

    adjust_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    reason TEXT,
    note TEXT,
    created_by BIGINT REFERENCES staff(id) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stock_adjustment_items (
    id BIGSERIAL PRIMARY KEY,
    adjustment_id BIGINT REFERENCES stock_adjustments(id) NOT NULL,
    product_id BIGINT REFERENCES products(id) NOT NULL,
    system_qty INT NOT NULL,
    actual_qty INT NOT NULL,
    diff_qty INT NOT NULL,
    unit_cost_snapshot DECIMAL(15, 2) NOT NULL,
    note TEXT
);
