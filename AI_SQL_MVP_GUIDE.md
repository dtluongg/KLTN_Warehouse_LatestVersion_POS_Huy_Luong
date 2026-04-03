# AI Chat Sinh SQL Cho POS/Kho - MVP Guide

## Muc tieu

Xay tinh nang chat noi bo cho nhan vien:

- Nhan vien hoi bang ngon ngu tu nhien.
- AI sinh ra 1 cau `SQL SELECT`.
- Backend validate cau SQL truoc khi chay.
- Backend query DB va lay du lieu that.
- Backend hoac AI dien giai ket qua thanh cau tra loi de hieu.

Huong nay phu hop cho project nho, demo, do an, PoC. Day la MVP co guardrails, chua phai kien truc production cuoi cung.

## Nguyen tac bat buoc

1. Chi cho AI sinh `SELECT`.
2. Khong chay SQL tho neu chua validate.
3. Chi cho query cac bang da whitelist.
4. Chi cho dung cac cot da co trong schema that.
5. Luon gioi han ket qua, vi du `LIMIT 20`.
6. Log lai `user message`, `generated SQL`, `result summary`.

## Cach lam MVP don gian nhat

Voi project nay, cach don gian nhat la:

1. Backend co 1 `system prompt` co dinh.
2. Trong prompt, liet ke ro cac bang, cot va quan he join chinh.
3. User gui cau hoi.
4. Backend gui `system prompt + user question` cho AI.
5. AI tra ve dung 1 cau `SELECT`.
6. Backend validate SQL.
7. Neu hop le thi execute query va tra ket qua.

Khong can metadata dong. Khong can RLS cho ban MVP. Khong can co che phuc tap hon neu hien tai ban muon di nhanh.

## Schema that tu migration

Schema duoi day duoc quet lai tu:

- `backend/src/main/resources/db/migration/V1__init_master_tables.sql`
- `backend/src/main/resources/db/migration/V2__init_purchase_orders.sql`
- `backend/src/main/resources/db/migration/V3__init_goods_receipts.sql`
- `backend/src/main/resources/db/migration/V4__init_orders.sql`
- `backend/src/main/resources/db/migration/V5__init_returns_documents.sql`
- `backend/src/main/resources/db/migration/V6__init_inventory_movements.sql`
- `backend/src/main/resources/db/migration/V7__init_stock_adjustments.sql`

### Bang nen whitelist cho AI

- `categories`
- `customers`
- `suppliers`
- `products`
- `warehouse`
- `coupons`
- `purchase_orders`
- `purchase_order_items`
- `goods_receipts`
- `goods_receipt_items`
- `orders`
- `order_items`
- `customer_returns`
- `customer_return_items`
- `supplier_returns`
- `supplier_return_items`
- `inventory_movements`
- `inventory_balance`
- `stock_adjustments`
- `stock_adjustment_items`

### Bang khong nen dua vao prompt AI

- `staff`

Ly do:

- co `username`
- co `password_hash`
- co thong tin nhan vien nhay cam

Neu sau nay can query nhan vien, nen lam tool rieng hoac chi expose 1 vai cot an toan.

## Bang va cot thuc te

### `categories`

```text
categories(
  id,
  name,
  slug,
  is_active,
  deleted_at
)
```

### `customers`

```text
customers(
  id,
  customer_code,
  name,
  phone,
  email,
  tax_code,
  address,
  is_active,
  deleted_at,
  created_at
)
```

### `suppliers`

```text
suppliers(
  id,
  supplier_code,
  name,
  phone,
  tax_code,
  address,
  is_active,
  deleted_at
)
```

### `products`

```text
products(
  id,
  sku,
  barcode,
  name,
  short_name,
  category_id,
  sale_price,
  avg_cost,
  last_purchase_cost,
  vat_rate,
  image_url,
  is_active,
  deleted_at,
  created_at,
  updated_at
)
```

### `warehouse`

```text
warehouse(
  id,
  code,
  name,
  address,
  is_active,
  deleted_at
)
```

### `coupons`

```text
coupons(
  id,
  code,
  discount_type,
  discount_value,
  min_order_amount,
  max_discount_amount,
  starts_at,
  ends_at,
  usage_limit,
  used_count,
  is_active,
  deleted_at,
  created_at
)
```

### `purchase_orders`

```text
purchase_orders(
  id,
  po_no,
  supplier_id,
  warehouse_id,
  total_amount,
  total_vat,
  total_amount_payable,
  order_date,
  expected_date,
  status,
  note,
  created_by,
  created_at
)
```

### `purchase_order_items`

```text
purchase_order_items(
  id,
  po_id,
  product_id,
  ordered_qty,
  expected_unit_cost,
  line_total
)
```

### `goods_receipts`

```text
goods_receipts(
  id,
  gr_no,
  po_id,
  supplier_id,
  warehouse_id,
  total_amount,
  total_vat,
  total_amount_payable,
  receipt_date,
  status,
  note,
  created_by,
  created_at
)
```

### `goods_receipt_items`

```text
goods_receipt_items(
  id,
  gr_id,
  po_item_id,
  product_id,
  received_qty,
  unit_cost,
  line_total
)
```

### `orders`

```text
orders(
  id,
  order_no,
  sales_channel,
  customer_id,
  warehouse_id,
  order_time,
  status,
  gross_amount,
  discount_amount,
  coupon_code,
  coupon_discount_amount,
  surcharge_amount,
  net_amount,
  payment_method,
  note,
  created_by,
  created_at
)
```

### `order_items`

```text
order_items(
  id,
  order_id,
  product_id,
  qty,
  sale_price,
  cost_at_sale,
  line_revenue,
  line_cogs,
  line_profit
)
```

### `customer_returns`

```text
customer_returns(
  id,
  return_no,
  customer_id,
  order_id,
  warehouse_id,
  total_refund,
  return_date,
  status,
  note,
  created_by,
  created_at
)
```

### `customer_return_items`

```text
customer_return_items(
  id,
  customer_return_id,
  order_item_id,
  product_id,
  qty,
  refund_amount,
  note
)
```

### `supplier_returns`

```text
supplier_returns(
  id,
  return_no,
  supplier_id,
  goods_receipt_id,
  warehouse_id,
  total_amount,
  total_vat,
  total_amount_payable,
  return_date,
  status,
  note,
  created_by,
  created_at
)
```

### `supplier_return_items`

```text
supplier_return_items(
  id,
  supplier_return_id,
  goods_receipt_item_id,
  product_id,
  qty,
  return_amount,
  note
)
```

### `inventory_movements`

```text
inventory_movements(
  id,
  product_id,
  warehouse_id,
  movement_type,
  qty,
  ref_table,
  ref_id,
  note,
  created_by,
  created_at
)
```

### `inventory_balance`

```text
inventory_balance(
  warehouse_id,
  product_id,
  on_hand,
  updated_at
)
```

### `stock_adjustments`

```text
stock_adjustments(
  id,
  adjust_no,
  warehouse_id,
  adjust_date,
  status,
  reason,
  note,
  created_by,
  created_at
)
```

### `stock_adjustment_items`

```text
stock_adjustment_items(
  id,
  adjustment_id,
  product_id,
  system_qty,
  actual_qty,
  diff_qty,
  unit_cost_snapshot,
  note
)
```

## Quan he join chinh

```text
products.category_id = categories.id

purchase_orders.supplier_id = suppliers.id
purchase_orders.warehouse_id = warehouse.id
purchase_order_items.po_id = purchase_orders.id
purchase_order_items.product_id = products.id

goods_receipts.po_id = purchase_orders.id
goods_receipts.supplier_id = suppliers.id
goods_receipts.warehouse_id = warehouse.id
goods_receipt_items.gr_id = goods_receipts.id
goods_receipt_items.po_item_id = purchase_order_items.id
goods_receipt_items.product_id = products.id

orders.customer_id = customers.id
orders.warehouse_id = warehouse.id
order_items.order_id = orders.id
order_items.product_id = products.id

customer_returns.customer_id = customers.id
customer_returns.order_id = orders.id
customer_returns.warehouse_id = warehouse.id
customer_return_items.customer_return_id = customer_returns.id
customer_return_items.order_item_id = order_items.id
customer_return_items.product_id = products.id

supplier_returns.supplier_id = suppliers.id
supplier_returns.goods_receipt_id = goods_receipts.id
supplier_returns.warehouse_id = warehouse.id
supplier_return_items.supplier_return_id = supplier_returns.id
supplier_return_items.goods_receipt_item_id = goods_receipt_items.id
supplier_return_items.product_id = products.id

inventory_movements.product_id = products.id
inventory_movements.warehouse_id = warehouse.id

inventory_balance.product_id = products.id
inventory_balance.warehouse_id = warehouse.id

stock_adjustments.warehouse_id = warehouse.id
stock_adjustment_items.adjustment_id = stock_adjustments.id
stock_adjustment_items.product_id = products.id
```

## Prompt mau nen dung

```text
Ban la tro ly tao SQL cho he thong POS/kho.

Nhiem vu:
- Chuyen cau hoi tieng Viet cua nhan vien thanh dung 1 cau SQL SELECT.
- Chi tra ve SQL, khong giai thich, khong markdown.

Rang buoc bat buoc:
- Chi duoc dung SELECT.
- Khong dung INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE, GRANT, REVOKE, CALL.
- Khong duoc tra ve nhieu hon 1 cau lenh.
- Neu truy van co the tra nhieu dong, them LIMIT 20.
- Chi duoc dung dung ten bang va ten cot trong schema ben duoi.
- Khong duoc query bang staff.

Schema duoc phep dung:

categories(id, name, slug, is_active, deleted_at)
customers(id, customer_code, name, phone, email, tax_code, address, is_active, deleted_at, created_at)
suppliers(id, supplier_code, name, phone, tax_code, address, is_active, deleted_at)
products(id, sku, barcode, name, short_name, category_id, sale_price, avg_cost, last_purchase_cost, vat_rate, image_url, is_active, deleted_at, created_at, updated_at)
warehouse(id, code, name, address, is_active, deleted_at)
coupons(id, code, discount_type, discount_value, min_order_amount, max_discount_amount, starts_at, ends_at, usage_limit, used_count, is_active, deleted_at, created_at)
purchase_orders(id, po_no, supplier_id, warehouse_id, total_amount, total_vat, total_amount_payable, order_date, expected_date, status, note, created_by, created_at)
purchase_order_items(id, po_id, product_id, ordered_qty, expected_unit_cost, line_total)
goods_receipts(id, gr_no, po_id, supplier_id, warehouse_id, total_amount, total_vat, total_amount_payable, receipt_date, status, note, created_by, created_at)
goods_receipt_items(id, gr_id, po_item_id, product_id, received_qty, unit_cost, line_total)
orders(id, order_no, sales_channel, customer_id, warehouse_id, order_time, status, gross_amount, discount_amount, coupon_code, coupon_discount_amount, surcharge_amount, net_amount, payment_method, note, created_by, created_at)
order_items(id, order_id, product_id, qty, sale_price, cost_at_sale, line_revenue, line_cogs, line_profit)
customer_returns(id, return_no, customer_id, order_id, warehouse_id, total_refund, return_date, status, note, created_by, created_at)
customer_return_items(id, customer_return_id, order_item_id, product_id, qty, refund_amount, note)
supplier_returns(id, return_no, supplier_id, goods_receipt_id, warehouse_id, total_amount, total_vat, total_amount_payable, return_date, status, note, created_by, created_at)
supplier_return_items(id, supplier_return_id, goods_receipt_item_id, product_id, qty, return_amount, note)
inventory_movements(id, product_id, warehouse_id, movement_type, qty, ref_table, ref_id, note, created_by, created_at)
inventory_balance(warehouse_id, product_id, on_hand, updated_at)
stock_adjustments(id, adjust_no, warehouse_id, adjust_date, status, reason, note, created_by, created_at)
stock_adjustment_items(id, adjustment_id, product_id, system_qty, actual_qty, diff_qty, unit_cost_snapshot, note)

Relationships:
products.category_id = categories.id
purchase_orders.supplier_id = suppliers.id
purchase_orders.warehouse_id = warehouse.id
purchase_order_items.po_id = purchase_orders.id
purchase_order_items.product_id = products.id
goods_receipts.po_id = purchase_orders.id
goods_receipts.supplier_id = suppliers.id
goods_receipts.warehouse_id = warehouse.id
goods_receipt_items.gr_id = goods_receipts.id
goods_receipt_items.po_item_id = purchase_order_items.id
goods_receipt_items.product_id = products.id
orders.customer_id = customers.id
orders.warehouse_id = warehouse.id
order_items.order_id = orders.id
order_items.product_id = products.id
customer_returns.customer_id = customers.id
customer_returns.order_id = orders.id
customer_returns.warehouse_id = warehouse.id
customer_return_items.customer_return_id = customer_returns.id
customer_return_items.order_item_id = order_items.id
customer_return_items.product_id = products.id
supplier_returns.supplier_id = suppliers.id
supplier_returns.goods_receipt_id = goods_receipts.id
supplier_returns.warehouse_id = warehouse.id
supplier_return_items.supplier_return_id = supplier_returns.id
supplier_return_items.goods_receipt_item_id = goods_receipt_items.id
supplier_return_items.product_id = products.id
inventory_movements.product_id = products.id
inventory_movements.warehouse_id = warehouse.id
inventory_balance.product_id = products.id
inventory_balance.warehouse_id = warehouse.id
stock_adjustments.warehouse_id = warehouse.id
stock_adjustment_items.adjustment_id = stock_adjustments.id
stock_adjustment_items.product_id = products.id
```

## Validator toi thieu o backend

Truoc khi execute, can check:

- SQL sau khi trim phai bat dau bang `select`
- khong chua `;`
- khong chua tu cam:
  - `insert`
  - `update`
  - `delete`
  - `drop`
  - `alter`
  - `truncate`
  - `create`
  - `grant`
  - `revoke`
  - `execute`
  - `call`
  - `copy`
- khong query bang ngoai whitelist
- neu chua co `limit` thi backend tu append `LIMIT 20`

Neu fail bat ky rule nao thi tu choi chay.

## Vi du cau hoi va SQL dung ten cot that

### Vi du 1

User:

```text
Cho toi 10 don hang moi nhat
```

SQL mong doi:

```sql
SELECT id, order_no, net_amount, status, order_time
FROM orders
ORDER BY order_time DESC
LIMIT 10
```

### Vi du 2

User:

```text
Gia san pham kem cat canh la bao nhieu
```

SQL mong doi:

```sql
SELECT id, sku, name, sale_price
FROM products
WHERE LOWER(name) LIKE LOWER('%kem cat canh%')
LIMIT 20
```

### Vi du 3

User:

```text
San pham nao ton kho thap o kho chinh
```

SQL mong doi:

```sql
SELECT p.id, p.sku, p.name, ib.on_hand
FROM inventory_balance ib
JOIN products p ON ib.product_id = p.id
JOIN warehouse w ON ib.warehouse_id = w.id
WHERE w.code = 'KHO_CHINH'
ORDER BY ib.on_hand ASC
LIMIT 20
```

### Vi du 4

User:

```text
Nha cung cap nao co nhieu phieu nhap nhat
```

SQL mong doi:

```sql
SELECT s.id, s.supplier_code, s.name, COUNT(gr.id) AS goods_receipt_count
FROM suppliers s
JOIN goods_receipts gr ON gr.supplier_id = s.id
GROUP BY s.id, s.supplier_code, s.name
ORDER BY goods_receipt_count DESC
LIMIT 20
```

## Neu dang dung Supabase chi voi URL + key

Neu hien tai project cua ban dang dung:

- SUPABASE_DB_URL = JDBC URL Postgres
- SUPABASE_DB_USERNAME = user DB
- SUPABASE_DB_PASSWORD = password DB

thi van lam MVP duoc binh thuong.

Trong giai doan dau, trong tam la:

1. AI chi sinh `SELECT`
2. Prompt schema phai dung ten bang va cot that
3. Backend validate SQL that chat
4. Chi whitelist bang can thiet
5. Ep `LIMIT`
6. Log toan bo SQL de debug

Ban chua can metadata dong, chua can RLS, chua can co che phuc tap hon neu muc tieu la chay nhanh.

## Checklist trien khai

- tao DTO cho AI chat request/response
- tao `system prompt` co schema that
- viet `SqlSafetyValidator`
- viet query executor
- log prompt, SQL, thoi gian chay
- them test cho SQL bi chan

## Ket luan

Huong MVP hop ly nhat cho project nay la:

- nhet schema that vao prompt
- cho AI sinh dung 1 cau `SELECT`
- backend validate truoc khi chay

Neu sau nay feature song tot, luc do moi nang cap sang:

- structured query JSON
- tool calling
- alias ten san pham
- fuzzy search
