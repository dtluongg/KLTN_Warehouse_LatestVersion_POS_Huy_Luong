CREATE TABLE customer_returns (
    id BIGSERIAL PRIMARY KEY,
    return_no VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) NOT NULL,
    order_id BIGINT REFERENCES orders(id),
    return_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    note TEXT,
    created_by BIGINT REFERENCES staff(id) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customer_return_items (
    id BIGSERIAL PRIMARY KEY,
    customer_return_id BIGINT REFERENCES customer_returns(id) NOT NULL,
    order_item_id BIGINT REFERENCES order_items(id),
    product_id BIGINT REFERENCES products(id) NOT NULL,
    qty INT NOT NULL,
    refund_amount DECIMAL(15, 2) NOT NULL,
    note TEXT
);

CREATE TABLE supplier_returns (
    id BIGSERIAL PRIMARY KEY,
    return_no VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id) NOT NULL,
    goods_receipt_id BIGINT REFERENCES goods_receipts(id),
    return_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    note TEXT,
    created_by BIGINT REFERENCES staff(id) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE supplier_return_items (
    id BIGSERIAL PRIMARY KEY,
    supplier_return_id BIGINT REFERENCES supplier_returns(id) NOT NULL,
    goods_receipt_item_id BIGINT REFERENCES goods_receipt_items(id),
    product_id BIGINT REFERENCES products(id) NOT NULL,
    qty INT NOT NULL,
    return_amount DECIMAL(15, 2) NOT NULL,
    note TEXT
);
