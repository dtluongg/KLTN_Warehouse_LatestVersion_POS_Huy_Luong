# MVP POS + Inventory Schema (As-Built)

## 1) Muc tieu tai lieu

Tai lieu nay la ban cap nhat theo code backend hien tai (Spring Boot + Flyway), thay cho ban thiet ke cu.

- Nguon doi chieu: migration V1 -> V15, entity, enum, controller.
- Muc tieu: mo ta dung schema va workflow dang chay.

## 2) Ket luan nhanh

Backend core cho MVP da hoan thanh theo pham vi da chot truoc do:

- Master data CRUD: co.
- Document flow chinh: co (tao/sua draft/chot voi cac chung tu kho).
- Inventory ledger + snapshot ton: co.
- Coupon backend validation + preview cho order: co.
- Order status da duoc chuan hoa sang DocumentStatus.

Luu y pham vi hien tai:

- Chua co bang audit_logs trong DB.
- Warehouse hien tai chua co API DELETE.
- Order POS tao la chot ngay (POSTED), chua co endpoint update/void order.

## 3) Enum dang dung trong backend

### 3.1 DocumentStatus

- DRAFT
- POSTED
- CANCELLED

Ap dung cho: orders, purchase_orders, goods_receipts, customer_returns, supplier_returns, stock_adjustments.

### 3.2 PaymentMethod

- CASH
- TRANSFER
- MIX
- DEBT
- CARD

### 3.3 SalesChannel

- POS
- WEB

### 3.4 InventoryMovementType

- PURCHASE_IN
- SALE_OUT
- RETURN_IN
- RETURN_OUT
- TRANSFER_IN
- TRANSFER_OUT
- CONVERSION_IN
- CONVERSION_OUT
- ADJUST_IN
- ADJUST_OUT

## 4) DB schema thuc te (Flyway)

## 4.1 Master data

### categories

- id (BIGSERIAL, PK)
- name
- slug (unique)
- is_active

### customers

- id (UUID, PK)
- customer_code (unique)
- name, phone, email, tax_code, address
- is_active
- created_at

### staff

- id (BIGSERIAL, PK)
- staff_code (unique)
- full_name, phone, email, tax_code, address
- hire_date
- is_active
- username (unique)
- password_hash
- role
- last_login_at
- created_at

### suppliers

- id (UUID, PK)
- supplier_code (unique)
- name, phone, tax_code, address
- is_active

### products

- id (BIGSERIAL, PK)
- sku (unique)
- barcode (unique, nullable)
- name, short_name
- category_id (FK -> categories.id)
- sale_price
- avg_cost
- last_purchase_cost
- vat_rate
- image_url
- is_active
- created_at, updated_at

### supplier_products

- id (BIGSERIAL, PK)
- supplier_id (UUID, FK -> suppliers.id)
- product_id (BIGSERIAL, FK -> products.id)
- standard_price (NUMERIC(18,2))
- is_active (BOOLEAN)
- last_updated_at (TIMESTAMP)
- created_at (TIMESTAMP)
- unique(supplier_id, product_id)

Ghi chu:

- Bảng `supplier_products` lưu ánh xạ sản phẩm mà nhà cung cấp cung cấp cùng mức giá tham khảo (`standard_price`) và trạng thái `is_active`.
- Dùng để kiểm tra ràng buộc khi tạo `purchase_orders` theo nhà cung cấp và cho frontend hiển thị giá nhà cung cấp nếu cần.


Ghi chu:

- Khong co cot on_hand trong products.
- Ton hien tai doc tu inventory_balance.
- avg_cost duoc backend cap nhat theo Moving Average khi POSTED goods_receipt.
- Cong thuc cap nhat avg_cost:
  avg_cost_moi = ((so_luong_cu _ avg_cost_cu) + (so_luong_nhap _ don_gia_nhap)) / (so_luong_cu + so_luong_nhap)
- Trong backend hien tai, so_luong_cu la ton toan he thong cua san pham (tong tat ca warehouse), khong phai ton rieng 1 chi nhanh.
- last_purchase_cost duoc backend cap nhat bang unit_cost lan nhap gan nhat khi POSTED goods_receipt.
- API Product khong cho sua truc tiep avg_cost qua request body.
- Có thêm field delete_at cho các bảng master

### warehouse

- id (BIGSERIAL, PK)
- code (unique)
- name
- address
- is_active

### coupons

- id (BIGSERIAL, PK)
- code (unique)
- discount_type
- discount_value
- min_order_amount
- max_discount_amount
- starts_at, ends_at
- usage_limit
- used_count
- is_active
- created_at

## 4.2 Purchase Order

### purchase_orders

- id (BIGSERIAL, PK)
- po_no (unique)
- supplier_id (FK -> suppliers.id)
- warehouse_id (FK -> warehouse.id)
- total_amount
- total_vat
- total_amount_payable
- order_date
- expected_date
- status (DocumentStatus)
- note
- created_by (FK -> staff.id)
- created_at

### purchase_order_items

- id (BIGSERIAL, PK)
- po_id (FK -> purchase_orders.id)
- product_id (FK -> products.id)
- ordered_qty
- expected_unit_cost
- line_total
- unique(po_id, product_id)

## 4.3 Goods Receipt

### goods_receipts

- id (BIGSERIAL, PK)
- gr_no (unique)
- po_id (FK -> purchase_orders.id)
- supplier_id (FK -> suppliers.id)
- warehouse_id (FK -> warehouse.id)
- total_amount
- total_vat
- total_amount_payable
- receipt_date
- status (DocumentStatus)
- note
- created_by (FK -> staff.id)
- created_at

### goods_receipt_items

- id (BIGSERIAL, PK)
- gr_id (FK -> goods_receipts.id)
- po_item_id (FK -> purchase_order_items.id, nullable)
- product_id (FK -> products.id)
- received_qty
- unit_cost
- line_total

## 4.4 Orders

### orders

- id (BIGSERIAL, PK)
- order_no (unique)
- sales_channel (POS/WEB)
- customer_id (FK -> customers.id, nullable)
- warehouse_id (FK -> warehouse.id)
- order_time
- status (DocumentStatus)
- gross_amount
- discount_amount
- coupon_code
- coupon_discount_amount
- surcharge_amount
- net_amount
- payment_method
- note
- created_by (FK -> staff.id)
- created_at

### order_items

- id (BIGSERIAL, PK)
- order_id (FK -> orders.id)
- product_id (FK -> products.id)
- qty
- sale_price
- cost_at_sale
- line_revenue
- line_cogs
- line_profit

Ghi chu quan trong:

- Migration V15 da map du lieu cu: COMPLETED -> POSTED.
- Coupon discount duoc backend tinh/validate, frontend chi gui couponCode.

## 4.5 Return documents

### customer_returns

- id (BIGSERIAL, PK)
- return_no (unique)
- customer_id (FK -> customers.id)
- order_id (FK -> orders.id, nullable)
- warehouse_id (FK -> warehouse.id)
- total_refund
- return_date
- status (DocumentStatus)
- note
- created_by (FK -> staff.id)
- created_at

### customer_return_items

- id (BIGSERIAL, PK)
- customer_return_id (FK -> customer_returns.id)
- order_item_id (FK -> order_items.id, nullable)
- product_id (FK -> products.id)
- qty
- refund_amount
- note

### supplier_returns

- id (BIGSERIAL, PK)
- return_no (unique)
- supplier_id (FK -> suppliers.id)
- goods_receipt_id (FK -> goods_receipts.id, nullable)
- warehouse_id (FK -> warehouse.id)
- total_amount
- total_vat
- total_amount_payable
- return_date
- status (DocumentStatus)
- note
- created_by (FK -> staff.id)
- created_at

### supplier_return_items

- id (BIGSERIAL, PK)
- supplier_return_id (FK -> supplier_returns.id)
- goods_receipt_item_id (FK -> goods_receipt_items.id, nullable)
- product_id (FK -> products.id)
- qty
- return_amount
- note

## 4.6 Inventory ledger + snapshot

### inventory_movements

- id (BIGSERIAL, PK)
- product_id (FK -> products.id)
- warehouse_id (FK -> warehouse.id)
- movement_type
- qty
- ref_table
- ref_id
- note
- created_by (FK -> staff.id)
- created_at

### inventory_balance

- warehouse_id (FK -> warehouse.id)
- product_id (FK -> products.id)
- on_hand
- updated_at
- PK (warehouse_id, product_id)

Trigger dang co:

- Sau moi INSERT inventory_movements, trigger cap nhat inventory_balance theo signed qty.

## 4.7 Stock adjustment

### stock_adjustments

- id (BIGSERIAL, PK)
- adjust_no (unique)
- warehouse_id (FK -> warehouse.id)
- adjust_date
- status (DocumentStatus)
- reason
- note
- created_by (FK -> staff.id)
- created_at

### stock_adjustment_items

- id (BIGSERIAL, PK)
- adjustment_id (FK -> stock_adjustments.id)
- product_id (FK -> products.id)
- system_qty
- actual_qty
- diff_qty
- unit_cost_snapshot
- note

## 5) Numbering logic (V13)

DB trigger auto-generate cho:

- order_no: ORD + YYYYMMDD + seq
- po_no: PO + YYYYMMDD + seq
- gr_no: GR + YYYYMMDD + seq
- customer return_no: CR + YYYYMMDD + seq
- supplier return_no: SR + YYYYMMDD + seq
- stock adjustment adjust_no: SA + YYYYMMDD + seq

## 6) Index dang co (V8)

- inventory_movements(product_id, created_at)
- inventory_movements(ref_table, ref_id)
- inventory_movements(warehouse_id, product_id)
- inventory_balance(product_id)
- orders(order_time)
- orders(customer_id)
- purchase_orders(supplier_id)
 - supplier_products(supplier_id, product_id)

## 7) API/backend workflow hien tai

## 7.1 Order

- GET /api/orders
- GET /api/orders/{id} (id chi nhan so)
- GET /api/orders/{id}/items
- GET /api/orders/coupon-preview
- POST /api/orders

Behavior:

- Tao order POS se set status = POSTED (ban chot ngay).
- Coupon invalid se bi reject.

## 7.2 Purchase Order

- GET /api/purchase-orders
- GET /api/purchase-orders/{id}
- POST /api/purchase-orders
- PUT /api/purchase-orders/{id} (chi draft)
- PATCH /api/purchase-orders/{id}/status

## 7.3 Goods Receipt

- GET /api/goods-receipts
- GET /api/goods-receipts/{id}
- POST /api/goods-receipts
- PUT /api/goods-receipts/{id} (chi draft)
- POST /api/goods-receipts/{id}/complete

## 7.4 Customer Return

- GET /api/customer-returns
- GET /api/customer-returns/{id}
- POST /api/customer-returns
- PUT /api/customer-returns/{id} (chi draft)
- POST /api/customer-returns/{id}/complete

## 7.5 Supplier Return

- GET /api/supplier-returns
- GET /api/supplier-returns/{id}
- POST /api/supplier-returns
- PUT /api/supplier-returns/{id} (chi draft)
- POST /api/supplier-returns/{id}/complete

## 7.6 Stock Adjustment

- GET /api/stock-adjustments
- GET /api/stock-adjustments/{id}
- POST /api/stock-adjustments
- PUT /api/stock-adjustments/{id} (chi draft)
- POST /api/stock-adjustments/{id}/complete

## 7.7 Inventory movement

- GET /api/inventory-movements
- GET /api/inventory-movements/{id}

Read-only theo thiet ke ledger.

## 8) Chenh lech so voi ban blueprint cu

- Order status khong con COMPLETED/VOID, hien tai dung DRAFT/POSTED/CANCELLED.
- Sales channel la POS/WEB (khong phai ONLINE).
- Payment method la CASH/TRANSFER/MIX/DEBT/CARD.
- Ton kho snapshot khong nam trong products, ma nam trong inventory_balance.
- Chua co bang audit_logs.
- Purchase order da duoc chuan hoa ve DocumentStatus.

## 9) Ghi chu de mo rong tiep

Neu can mo rong sau MVP:

- Them audit_logs + rule ghi log transition.
- Them API void/cancel cho order neu can nghiep vu huy don da chot.
- Them warehouse delete (soft delete) neu can.
- Them cong no chi tiet cho DEBT.
