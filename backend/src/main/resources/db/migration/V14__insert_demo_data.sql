-- ============================================================================
-- V14: SEED DATA ĐẦY ĐỦ CHO TẤT CẢ CÁC BẢNG
-- Dữ liệu mẫu ngành VTNN (Vật tư Nông nghiệp) khu vực ĐBSCL
-- ============================================================================

-- ═══════════════════════════ 1. DANH MỤC (categories) ═══════════════════════
INSERT INTO categories (name, slug, is_active) VALUES 
('Phân bón', 'phan-bon', true),
('Thuốc Bảo Vệ Thực Vật', 'thuoc-bvtv', true),
('Hạt giống', 'hat-giong', true),
('Dụng cụ nông nghiệp', 'dung-cu', true);


-- ═══════════════════════════ 2. KHO HÀNG (warehouse) ════════════════════════
INSERT INTO warehouse (code, name, address, is_active) VALUES 
('KHO_CHINH', 'Kho Chính (Vĩnh Long)', '123 Đường Nông Nghiệp, Vĩnh Long', true),
('KHO_CN1', 'Kho Chi Nhánh 1 (Cần Thơ)', '456 QL1A, Cần Thơ', true);


-- ═══════════════════════════ 3. KHÁCH HÀNG (customers) ══════════════════════
INSERT INTO customers (customer_code, name, phone, email, address, is_active) VALUES 
('KH001', 'Nguyễn Thị Nông', '0901234567', 'nong.nguyen@gmail.com', 'Ấp 3, Xã Tân An, Vĩnh Long', true),
('KH002', 'Trần Văn Dân', '0912345678', NULL, 'Ấp Bình Hòa, Trà Vinh', true),
('KH003', 'Khách Lẻ', '', NULL, NULL, true),
('KH004', 'HTX Nông Sản Sạch', '0939876543', 'htxnss@gmail.com', '789 Đường Lê Lợi, Vĩnh Long', true);


-- ═══════════════════════════ 4. NHÀ CUNG CẤP (suppliers) ═══════════════════
INSERT INTO suppliers (supplier_code, name, phone, tax_code, address, is_active) VALUES 
('NCC001', 'Công ty TNHH Phân bón Phú Mỹ', '02838123456', '0301234567', 'KCN Phú Mỹ, Bà Rịa - Vũng Tàu', true),
('NCC002', 'Công ty CP Thuốc BVTV Sài Gòn', '02839876543', '0307654321', '123 Nguyễn Trãi, TP.HCM', true),
('NCC003', 'DNTN Hạt Giống Tân Phát', '02966112233', NULL, '456 Trần Hưng Đạo, Cần Thơ', true);


-- ═══════════════════════════ 5. SẢN PHẨM (products) ═════════════════════════
-- on_hand = 0 vì tồn kho sẽ được cập nhật qua inventory_movements trigger
INSERT INTO products (sku, barcode, name, short_name, category_id, sale_price, avg_cost, vat_rate, on_hand, image_url, is_active) VALUES 
('NPK-PM-01', '8930000100010', 'Phân bón NPK Phú Mỹ 20-20-15 (Bao 50kg)', 'NPK Phú Mỹ', 
  (SELECT id FROM categories WHERE slug = 'phan-bon'), 1550000, 1400000, 5, 0, 
  'https://images.unsplash.com/photo-1628183204961-3315a0cbb0f1?w=800&q=80', true),
('RAD-60SC', '8930000200020', 'Thuốc trừ sâu sinh học Radiant 60SC (Chai 100ml)', 'Radiant 60SC', 
  (SELECT id FROM categories WHERE slug = 'thuoc-bvtv'), 125000, 100000, 5, 0, 
  'https://images.unsplash.com/photo-1584478335025-a136ebdb49c1?w=800&q=80', true),
('AA-LEAF', '8930000300030', 'Phân bón lá Amino Acid (Chai 500ml)', 'Amino Acid', 
  (SELECT id FROM categories WHERE slug = 'phan-bon'), 85000, 60000, 5, 0, 
  'https://plus.unsplash.com/premium_photo-1664110696956-61bd58e7ab2f?w=800&q=80', true),
('SEED-WM', '8930000400040', 'Hạt giống Dưa hấu Mặt trời đỏ (Gói 20g)', 'HG Dưa hấu', 
  (SELECT id FROM categories WHERE slug = 'hat-giong'), 40000, 30000, 0, 0, 
  'https://images.unsplash.com/photo-1587049352847-4d4b1ed7adbf?w=800&q=80', true),
('GLY-480', '8930000500050', 'Thuốc diệt cỏ lưu dẫn Glyphosate (Chai 1L)', 'Glyphosate', 
  (SELECT id FROM categories WHERE slug = 'thuoc-bvtv'), 95000, 75000, 5, 0, 
  'https://plus.unsplash.com/premium_photo-1678344161962-43bb2227d8db?w=800&q=80', true),
('KIM-BAM', '8930000600060', 'Kềm cắt cành Fujiya', 'Kềm cắt cành', 
  (SELECT id FROM categories WHERE slug = 'dung-cu'), 250000, 180000, 10, 0, 
  'https://images.unsplash.com/photo-1416879598056-cb82b0e79782?w=800&q=80', true);


-- ═══════════════════════════ 6. MÃ GIẢM GIÁ (coupons) ══════════════════════
INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount_amount, starts_at, ends_at, usage_limit, used_count, is_active) VALUES
('KHAIMUA2026', 'PERCENT', 10, 500000, 200000, '2026-01-01 00:00:00', '2026-06-30 23:59:59', 100, 3, true),
('NOEL50K', 'FIXED', 50000, 300000, 50000, '2025-12-01 00:00:00', '2026-12-31 23:59:59', 50, 1, true),
('THANTRUNG', 'PERCENT', 5, 200000, 100000, '2026-01-01 00:00:00', '2026-03-31 23:59:59', 200, 12, false);


-- ═══════════════════════════ 7. ĐẶT HÀNG NCC (purchase_orders) ══════════════
-- order_no = '' → trigger tự sinh mã PO20260321xxxx
INSERT INTO purchase_orders (po_no, supplier_id, warehouse_id, order_date, expected_date, status, note, total_amount, total_vat, total_amount_payable, created_by) VALUES
('', (SELECT id FROM suppliers WHERE supplier_code = 'NCC001'), 
    (SELECT id FROM warehouse WHERE code = 'KHO_CHINH'),
    '2026-03-10', '2026-03-15', 'POSTED', 'Đơn nhập phân bón đầu mùa', 
    212000000, 10600000, 222600000, 1),
('', (SELECT id FROM suppliers WHERE supplier_code = 'NCC002'), 
    (SELECT id FROM warehouse WHERE code = 'KHO_CHINH'),
    '2026-03-12', '2026-03-18', 'POSTED', 'Đơn nhập thuốc BVTV', 
    8750000, 437500, 9187500, 1),
('', (SELECT id FROM suppliers WHERE supplier_code = 'NCC003'), 
    (SELECT id FROM warehouse WHERE code = 'KHO_CN1'),
    '2026-03-18', '2026-03-25', 'DRAFT', 'Đơn hạt giống - chờ duyệt', 
    6000000, 0, 6000000, 1);

-- Chi tiết đặt hàng (purchase_order_items)
INSERT INTO purchase_order_items (po_id, product_id, ordered_qty, expected_unit_cost, line_total) VALUES
-- PO #1: NPK Phú Mỹ 150 bao + Amino Acid 50 chai
(1, (SELECT id FROM products WHERE sku = 'NPK-PM-01'), 150, 1400000, 210000000),
(1, (SELECT id FROM products WHERE sku = 'AA-LEAF'), 50, 40000, 2000000),
-- PO #2: Radiant 50 chai + Glyphosate 25 chai
(2, (SELECT id FROM products WHERE sku = 'RAD-60SC'), 50, 100000, 5000000),
(2, (SELECT id FROM products WHERE sku = 'GLY-480'), 50, 75000, 3750000),
-- PO #3 (DRAFT): Hạt giống dưa hấu 200 gói
(3, (SELECT id FROM products WHERE sku = 'SEED-WM'), 200, 30000, 6000000);


-- ═══════════════════════════ 8. NHẬP HÀNG (goods_receipts) ══════════════════
INSERT INTO goods_receipts (gr_no, po_id, supplier_id, warehouse_id, receipt_date, status, note, total_amount, total_vat, total_amount_payable, created_by) VALUES
('', 1, (SELECT id FROM suppliers WHERE supplier_code = 'NCC001'),
    (SELECT id FROM warehouse WHERE code = 'KHO_CHINH'),
    '2026-03-15', 'POSTED', 'Nhập đủ hàng PO#1',
    212000000, 10600000, 222600000, 1),
('', 2, (SELECT id FROM suppliers WHERE supplier_code = 'NCC002'),
    (SELECT id FROM warehouse WHERE code = 'KHO_CHINH'),
    '2026-03-18', 'POSTED', 'Nhập thuốc BVTV PO#2',
    8750000, 437500, 9187500, 1);

-- Chi tiết nhập hàng (goods_receipt_items)
INSERT INTO goods_receipt_items (gr_id, po_item_id, product_id, received_qty, unit_cost, line_total) VALUES
-- GR #1: nhập từ PO#1
(1, 1, (SELECT id FROM products WHERE sku = 'NPK-PM-01'), 150, 1400000, 210000000),
(1, 2, (SELECT id FROM products WHERE sku = 'AA-LEAF'), 50, 40000, 2000000),
-- GR #2: nhập từ PO#2
(2, 3, (SELECT id FROM products WHERE sku = 'RAD-60SC'), 50, 100000, 5000000),
(2, 4, (SELECT id FROM products WHERE sku = 'GLY-480'), 50, 75000, 3750000);


-- ═══════════════════════════ 9. INVENTORY MOVEMENTS (từ nhập hàng) ═══════════
-- Trigger update_inventory_on_hand sẽ tự động cộng on_hand khi INSERT movement
INSERT INTO inventory_movements (product_id, warehouse_id, movement_type, qty, ref_table, ref_id, created_by) VALUES
-- Từ GR#1
((SELECT id FROM products WHERE sku = 'NPK-PM-01'), 1, 'PURCHASE_IN', 150, 'goods_receipts', 'GR-SEED-001', 1),
((SELECT id FROM products WHERE sku = 'AA-LEAF'), 1, 'PURCHASE_IN', 50, 'goods_receipts', 'GR-SEED-001', 1),
-- Từ GR#2
((SELECT id FROM products WHERE sku = 'RAD-60SC'), 1, 'PURCHASE_IN', 50, 'goods_receipts', 'GR-SEED-002', 1),
((SELECT id FROM products WHERE sku = 'GLY-480'), 1, 'PURCHASE_IN', 50, 'goods_receipts', 'GR-SEED-002', 1),
-- Nhập thêm kềm cắt cành (giả sử từ đợt trước)
((SELECT id FROM products WHERE sku = 'KIM-BAM'), 1, 'PURCHASE_IN', 50, 'goods_receipts', 'GR-OLD-001', 1),
-- Nhập hạt giống vào kho CN1 (đợt trước)
((SELECT id FROM products WHERE sku = 'SEED-WM'), 2, 'PURCHASE_IN', 200, 'goods_receipts', 'GR-OLD-002', 1);


-- ═══════════════════════════ 10. ĐƠN HÀNG BÁN (orders) ═════════════════════
INSERT INTO orders (order_no, sales_channel, customer_id, warehouse_id, order_time, status, gross_amount, discount_amount, coupon_code, coupon_discount_amount, surcharge_amount, net_amount, payment_method, note, created_by) VALUES
-- Đơn #1: Bà Nông mua NPK + Radiant, trả tiền mặt
('', 'POS', (SELECT id FROM customers WHERE customer_code = 'KH001'), 1,
  '2026-03-16 08:30:00', 'COMPLETED', 4775000, 0, NULL, 0, 0, 4775000, 'CASH', 'Bán buổi sáng', 1),
-- Đơn #2: Ông Dân mua Glyphosate, chuyển khoản
('', 'POS', (SELECT id FROM customers WHERE customer_code = 'KH002'), 1,
  '2026-03-17 14:15:00', 'COMPLETED', 285000, 0, NULL, 0, 0, 285000, 'TRANSFER', NULL, 1),
-- Đơn #3: Khách lẻ mua Amino Acid + Kềm, tiền mặt
('', 'POS', (SELECT id FROM customers WHERE customer_code = 'KH003'), 1,
  '2026-03-19 09:45:00', 'COMPLETED', 590000, 0, 'KHAIMUA2026', 59000, 0, 531000, 'CASH', 'KH dùng mã giảm giá', 1),
-- Đơn #4: HTX mua lớn, ghi nợ
('', 'POS', (SELECT id FROM customers WHERE customer_code = 'KH004'), 1,
  '2026-03-20 10:00:00', 'COMPLETED', 15625000, 0, NULL, 0, 0, 15625000, 'DEBT', 'HTX mua sỉ, ghi nợ 30 ngày', 1);

-- Chi tiết đơn hàng (order_items)
INSERT INTO order_items (order_id, product_id, qty, sale_price, cost_at_sale, line_revenue, line_cogs, line_profit) VALUES
-- Đơn #1: 3 bao NPK + 2 chai Radiant
(1, (SELECT id FROM products WHERE sku = 'NPK-PM-01'), 3, 1550000, 1400000, 4650000, 4200000, 450000),
(1, (SELECT id FROM products WHERE sku = 'RAD-60SC'), 1, 125000, 100000, 125000, 100000, 25000),
-- Đơn #2: 3 chai Glyphosate
(2, (SELECT id FROM products WHERE sku = 'GLY-480'), 3, 95000, 75000, 285000, 225000, 60000),
-- Đơn #3: 4 chai Amino Acid + 1 kềm
(3, (SELECT id FROM products WHERE sku = 'AA-LEAF'), 4, 85000, 60000, 340000, 240000, 100000),
(3, (SELECT id FROM products WHERE sku = 'KIM-BAM'), 1, 250000, 180000, 250000, 180000, 70000),
-- Đơn #4: 10 bao NPK + 5 chai Radiant
(4, (SELECT id FROM products WHERE sku = 'NPK-PM-01'), 10, 1550000, 1400000, 15500000, 14000000, 1500000),
(4, (SELECT id FROM products WHERE sku = 'RAD-60SC'), 1, 125000, 100000, 125000, 100000, 25000);

-- Inventory Movements cho các đơn bán hàng (SALE_OUT)
INSERT INTO inventory_movements (product_id, warehouse_id, movement_type, qty, ref_table, ref_id, created_by) VALUES
-- Đơn #1
((SELECT id FROM products WHERE sku = 'NPK-PM-01'), 1, 'SALE_OUT', 3, 'orders', 'ORD-SEED-001', 1),
((SELECT id FROM products WHERE sku = 'RAD-60SC'), 1, 'SALE_OUT', 1, 'orders', 'ORD-SEED-001', 1),
-- Đơn #2
((SELECT id FROM products WHERE sku = 'GLY-480'), 1, 'SALE_OUT', 3, 'orders', 'ORD-SEED-002', 1),
-- Đơn #3
((SELECT id FROM products WHERE sku = 'AA-LEAF'), 1, 'SALE_OUT', 4, 'orders', 'ORD-SEED-003', 1),
((SELECT id FROM products WHERE sku = 'KIM-BAM'), 1, 'SALE_OUT', 1, 'orders', 'ORD-SEED-003', 1),
-- Đơn #4
((SELECT id FROM products WHERE sku = 'NPK-PM-01'), 1, 'SALE_OUT', 10, 'orders', 'ORD-SEED-004', 1),
((SELECT id FROM products WHERE sku = 'RAD-60SC'), 1, 'SALE_OUT', 1, 'orders', 'ORD-SEED-004', 1);


-- ═══════════════════════════ 11. TRẢ HÀNG KHÁCH (customer_returns) ═══════════
INSERT INTO customer_returns (return_no, customer_id, order_id, return_date, status, note, warehouse_id, total_refund, created_by) VALUES
('', (SELECT id FROM customers WHERE customer_code = 'KH001'), 1,
  '2026-03-18', 'POSTED', 'KH trả 1 chai Radiant bị vỡ nắp',
  1, 125000, 1);

-- Chi tiết trả hàng KH
INSERT INTO customer_return_items (customer_return_id, order_item_id, product_id, qty, refund_amount, note) VALUES
(1, 2, (SELECT id FROM products WHERE sku = 'RAD-60SC'), 1, 125000, 'Chai bị vỡ nắp khi mở hộp');

-- Movement: Hàng nhập lại kho
INSERT INTO inventory_movements (product_id, warehouse_id, movement_type, qty, ref_table, ref_id, created_by) VALUES
((SELECT id FROM products WHERE sku = 'RAD-60SC'), 1, 'RETURN_IN', 1, 'customer_returns', 'CR-SEED-001', 1);


-- ═══════════════════════════ 12. TRẢ HÀNG NCC (supplier_returns) ═════════════
INSERT INTO supplier_returns (return_no, supplier_id, goods_receipt_id, return_date, status, note, warehouse_id, total_amount, total_vat, total_amount_payable, created_by) VALUES
('', (SELECT id FROM suppliers WHERE supplier_code = 'NCC002'), 2,
  '2026-03-20', 'DRAFT', 'Trả NCC 5 chai Glyphosate bị hết hạn in trên vỏ',
  1, 375000, 18750, 393750, 1);

-- Chi tiết trả hàng NCC
INSERT INTO supplier_return_items (supplier_return_id, goods_receipt_item_id, product_id, qty, return_amount, note) VALUES
(1, 4, (SELECT id FROM products WHERE sku = 'GLY-480'), 5, 393750, '5 chai hết hạn sử dụng trên nhãn');


-- ═══════════════════════════ 13. KIỂM KHO (stock_adjustments) ════════════════
INSERT INTO stock_adjustments (adjust_no, warehouse_id, adjust_date, status, reason, note, created_by) VALUES
-- Phiếu kiểm đã chốt
('', 1, '2026-03-19', 'POSTED', 'Kiểm kho định kỳ tháng 3', 'Phát hiện thiếu 2 chai Amino Acid', 1),
-- Phiếu kiểm đang nháp
('', 2, '2026-03-20', 'DRAFT', 'Kiểm kho CN1 đầu tuần', NULL, 1);

-- Chi tiết kiểm kho (stock_adjustment_items)
INSERT INTO stock_adjustment_items (adjustment_id, product_id, system_qty, actual_qty, diff_qty, unit_cost_snapshot, note) VALUES
-- Phiếu #1 (POSTED): Amino Acid thiếu 2 chai
(1, (SELECT id FROM products WHERE sku = 'AA-LEAF'), 46, 44, -2, 60000, 'Thiếu 2 chai, nghi hư hỏng'),
-- Phiếu #1: NPK đủ 
(1, (SELECT id FROM products WHERE sku = 'NPK-PM-01'), 137, 137, 0, 1400000, 'Đủ số lượng'),
-- Phiếu #2 (DRAFT): Hạt giống kiểm thử
(2, (SELECT id FROM products WHERE sku = 'SEED-WM'), 200, 198, -2, 30000, 'Chưa xác nhận');

-- Movement cho adjustment đã POSTED: ADJUST_OUT cho 2 chai Amino Acid bị thiếu
INSERT INTO inventory_movements (product_id, warehouse_id, movement_type, qty, ref_table, ref_id, created_by) VALUES
((SELECT id FROM products WHERE sku = 'AA-LEAF'), 1, 'ADJUST_OUT', 2, 'stock_adjustments', 'SA-SEED-001', 1);
