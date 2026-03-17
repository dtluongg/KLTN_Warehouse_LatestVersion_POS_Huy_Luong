CREATE TABLE inventory_movements (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(id) NOT NULL,
    warehouse_id BIGINT REFERENCES warehouse(id) NOT NULL,
    movement_type VARCHAR(50) NOT NULL, 
    qty INT NOT NULL,
    unit_cost DECIMAL(15, 2),
    ref_type VARCHAR(50) NOT NULL,
    ref_id VARCHAR(50) NOT NULL,
    note TEXT,
    created_by BIGINT REFERENCES staff(id) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
