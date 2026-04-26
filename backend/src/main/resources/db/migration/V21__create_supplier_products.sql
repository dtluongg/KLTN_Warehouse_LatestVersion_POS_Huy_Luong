-- V21: Bảng giá sản phẩm theo nhà cung cấp (Supplier Product Catalog)
-- Quản lý mối quan hệ NCC - SP và giá tham chiếu (standard_price)

CREATE TABLE IF NOT EXISTS supplier_products (
    id          BIGSERIAL    PRIMARY KEY,
    supplier_id UUID         NOT NULL REFERENCES suppliers(id),
    product_id  BIGINT       NOT NULL REFERENCES products(id),
    standard_price NUMERIC(18, 2) NOT NULL DEFAULT 0,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    last_updated_at TIMESTAMP,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_supplier_product UNIQUE (supplier_id, product_id)
);

-- Index cho truy vấn thường dùng
CREATE INDEX idx_supplier_products_supplier ON supplier_products(supplier_id);
CREATE INDEX idx_supplier_products_product  ON supplier_products(product_id);
CREATE INDEX idx_supplier_products_active   ON supplier_products(supplier_id, is_active);
