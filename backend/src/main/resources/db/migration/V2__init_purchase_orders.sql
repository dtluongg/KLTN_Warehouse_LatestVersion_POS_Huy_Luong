CREATE TABLE purchase_orders (
    id BIGSERIAL PRIMARY KEY,
    po_no VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id) NOT NULL,
    warehouse_id BIGINT REFERENCES warehouse(id) NOT NULL,
    total_amount DECIMAL(15, 2) DEFAULT 0,
    total_vat DECIMAL(15, 2) DEFAULT 0,
    total_amount_payable DECIMAL(15, 2) DEFAULT 0,
    order_date DATE NOT NULL,
    expected_date DATE,
    status VARCHAR(50) NOT NULL,
    note TEXT,
    created_by BIGINT REFERENCES staff(id) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_order_items (
    id BIGSERIAL PRIMARY KEY,
    po_id BIGINT REFERENCES purchase_orders(id) NOT NULL,
    product_id BIGINT REFERENCES products(id) NOT NULL,
    ordered_qty INT NOT NULL,
    expected_unit_cost DECIMAL(15, 2) NOT NULL,
    line_total DECIMAL(15, 2) NOT NULL,
    CONSTRAINT uq_po_product UNIQUE (po_id, product_id)
);
