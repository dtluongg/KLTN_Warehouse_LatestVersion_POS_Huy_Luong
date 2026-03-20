CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    sales_channel VARCHAR(50) NOT NULL,
    customer_id UUID REFERENCES customers(id),
    warehouse_id BIGINT REFERENCES warehouse(id) NOT NULL,
    order_time TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL,
    gross_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    coupon_code VARCHAR(50),
    coupon_discount_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    surcharge_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    net_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50) NOT NULL,
    note TEXT,
    created_by BIGINT REFERENCES staff(id) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id) NOT NULL,
    product_id BIGINT REFERENCES products(id) NOT NULL,
    qty INT NOT NULL,
    sale_price DECIMAL(15, 2) NOT NULL,
    cost_at_sale DECIMAL(15, 2) NOT NULL,
    line_revenue DECIMAL(15, 2) NOT NULL,
    line_cogs DECIMAL(15, 2) NOT NULL,
    line_profit DECIMAL(15, 2) NOT NULL
);
