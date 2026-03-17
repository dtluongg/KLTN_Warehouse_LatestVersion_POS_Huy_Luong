CREATE TABLE goods_receipts (
    id BIGSERIAL PRIMARY KEY,
    gr_no VARCHAR(50) UNIQUE NOT NULL,
    po_id BIGINT REFERENCES purchase_orders(id) NOT NULL,
    supplier_id UUID REFERENCES suppliers(id) NOT NULL,
    warehouse_id BIGINT REFERENCES warehouse(id) NOT NULL,
    receipt_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    note TEXT,
    created_by BIGINT REFERENCES staff(id) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE goods_receipt_items (
    id BIGSERIAL PRIMARY KEY,
    gr_id BIGINT REFERENCES goods_receipts(id) NOT NULL,
    po_item_id BIGINT REFERENCES purchase_order_items(id),
    product_id BIGINT REFERENCES products(id) NOT NULL,
    received_qty INT NOT NULL,
    unit_cost DECIMAL(15, 2) NOT NULL,
    line_total DECIMAL(15, 2) NOT NULL
);
