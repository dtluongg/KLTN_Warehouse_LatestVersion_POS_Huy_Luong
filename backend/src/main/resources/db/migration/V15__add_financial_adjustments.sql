-- Thêm trường Khấu trừ và Phụ phí cho nhập kho (Goods Receipts)
ALTER TABLE goods_receipts ADD COLUMN discount_amount DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE goods_receipts ADD COLUMN surcharge_amount DECIMAL(15,2) DEFAULT 0.00;

-- Thêm trường Khấu trừ và Phụ phí cho đơn đặt hàng (Purchase Orders)
ALTER TABLE purchase_orders ADD COLUMN discount_amount DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE purchase_orders ADD COLUMN surcharge_amount DECIMAL(15,2) DEFAULT 0.00;

-- Thêm trường Khấu trừ, Phụ phí và Lý do cho Trả hàng NCC (Supplier Returns)
ALTER TABLE supplier_returns ADD COLUMN discount_amount DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE supplier_returns ADD COLUMN surcharge_amount DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE supplier_returns ADD COLUMN reason VARCHAR(255);

-- Thêm trường Khấu trừ, Phụ phí và Lý do cho Trả hàng Khách (Customer Returns)
ALTER TABLE customer_returns ADD COLUMN discount_amount DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE customer_returns ADD COLUMN surcharge_amount DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE customer_returns ADD COLUMN reason VARCHAR(255);

-- (Bảng orders đã có sẵn discount_amount và surcharge_amount từ V4)
