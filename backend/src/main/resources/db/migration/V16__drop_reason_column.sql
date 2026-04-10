-- Xóa cột reason vì user quyết định chỉ dùng note
ALTER TABLE supplier_returns DROP COLUMN reason;
ALTER TABLE customer_returns DROP COLUMN reason;
