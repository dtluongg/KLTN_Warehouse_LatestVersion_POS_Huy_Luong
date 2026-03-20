# MVP Schema Blueprint - POS + Inventory (1 Kho)

## 1) Pham vi MVP da chot

- Quan ly 1 kho duy nhat.
- Co Purchase Order (PO) rieng.
- 1 PO co the nhap nhieu dot (nhieu Goods Receipt).
- Chua quan ly lo/han dung.
- NCC thanh toan ngay khi nhap (khong theo doi cong no NCC chi tiet trong MVP).
- Co ban no cho khach hang bang payment_method (tho), chua quan ly cong no chi tiet.
- Co nghiep vu tra hang: khach tra hang va tra hang cho NCC.
- Giu enum transfer/conversion trong movement_type de mo rong sau, chua tao bang chung tu rieng.
- Gia von dung Moving Average.

---

## 2) Nguyen tac ke toan kho

- Nguon su that ton kho: bang inventory_movements.
- Ton hien tai (on_hand) la gia tri snapshot de truy van nhanh.
- Gia von trung binh (avg_cost) tinh tu gia nhap thuc te o chi tiet phieu nhap.
- Gia ban POS tach biet voi gia von.

Cong thuc cap nhat gia von khi nhap:

avg*cost_new = ((qty_on_hand * avg*cost_old) + (qty_in * unit_cost_in)) / (qty_on_hand + qty_in)

---

## 3) Danh sach bang de xay moi

## 3.1 Master Data

### 3.1.1 categories

- Muc dich: Danh muc san pham.
- Cot chinh:
  - id (PK)
  - name
  - slug (unique)
  - is_active

### 3.1.2 customers

- Muc dich: Danh ba khach hang cho POS va ban no.
- Cot chinh:
  - id (PK, UUID hoac BIGINT)
  - customer_code (unique)
  - name
  - phone
  - email (nullable)
  - tax_code (nullable)
  - address (nullable)
  - is_active
  - created_at

### 3.1.3 staff

- Muc dich: Ho so + tai khoan nhan vien/admin dang nhap he thong.
- Cot chinh:
  - id (PK)
  - staff_code (unique)
  - full_name
  - phone
  - email (nullable)
  - tax_code (nullable)
  - address (nullable)
  - hire_date (nullable)
  - is_active
  - username (unique)
  - password_hash
  - role (SALES_STAFF, WAREHOUSE_STAFF, ADMIN)
  - last_login_at (nullable)
  - created_at

Ghi chu:

- Cac cot created_by trong he thong FK -> staff.id.

### 3.1.4 suppliers

- Muc dich: Nha cung cap.
- Cot chinh:
  - id (PK, UUID hoac BIGINT)
  - supplier_code (unique)
  - name
  - phone
  - tax_code (nullable)
  - address
  - is_active

### 3.1.5 products

- Muc dich: Don vi ban hang (moi dong la 1 SKU ban duoc).
- Cot chinh:
  - id (PK)
  - sku (unique)
  - barcode (unique, nullable)
  - name
  - short_name
  - category_id (FK -> categories.id)
  - sale_price (gia ban POS)
  - avg_cost (gia von trung binh hien tai)
  - last_purchase_cost
  - vat_rate
  - on_hand
  - is_active
  - created_at
  - updated_at

Ghi chu:

- sale_price phuc vu ban hang.
- avg_cost phuc vu tinh gia von.
- Tuyet doi khong dung sale_price de tinh COGS.

### 3.1.6 warehouse

- Muc dich: Kho duy nhat cua he thong.
- Cot chinh:
  - id (PK)
  - code (unique), vd: MAIN
  - name
  - address
  - is_active

Ghi chu:

- Du chi 1 kho van nen co bang nay de de mo rong sau.

### 3.1.7 coupons

- Muc dich: Quan ly ma giam gia su dung cho POS.
- Cot chinh:
  - id (PK)
  - code (unique)
  - discount_type (PERCENT, FIXED)
  - discount_value
  - min_order_amount (nullable)
  - max_discount_amount (nullable)
  - starts_at (nullable)
  - ends_at (nullable)
  - usage_limit (nullable)
  - used_count
  - is_active
  - created_at

Ghi chu:

- coupon_code tren orders la snapshot ma da ap dung tai thoi diem ban.
- coupon_discount_amount tren orders la snapshot so tien giam theo coupon.

### 3.1.8 audit_logs

- Muc dich: Luu nhat ky hanh dong nghiep vu (dac biet la doi trang thai chung tu).
- Cot chinh:
  - id (PK)
  - entity_type (ORDER, PURCHASE_ORDER, GOODS_RECEIPT, CUSTOMER_RETURN, SUPPLIER_RETURN, STOCK_ADJUSTMENT)
  - entity_id
  - action (CREATE, UPDATE, STATUS_CHANGE)
  - old_status (nullable)
  - new_status (nullable)
  - reason (nullable)
  - payload_json (nullable)
  - actor_staff_id (FK -> staff.id)
  - created_at

Ghi chu:

- `audit_logs` la noi luu audit log theo rule he thong.
- `reason` duoc dung cho ly do VOID/CANCELLED.
- Neu la doi trang thai thi luu `action = STATUS_CHANGE`, con trang thai cu/them moi nam o `old_status` va `new_status`.

---

## 3.2 Mua hang va nhap kho

### 3.2.1 purchase_orders

- Muc dich: Don dat hang mua (PO).
- Cot chinh:
  - id (PK)
  - po_no (unique), vd: PO-YYYYMMDD-XXXX
  - supplier_id (FK -> suppliers.id)
  - order_date
  - expected_date (nullable)
  - status (DRAFT, CONFIRMED, PARTIAL_RECEIVED, FULL_RECEIVED, CANCELLED)
  - note
  - created_by
  - created_at

### 3.2.2 purchase_order_items

- Muc dich: Chi tiet PO.
- Cot chinh:
  - id (PK)
  - po_id (FK -> purchase_orders.id)
  - product_id (FK -> products.id)
  - ordered_qty
  - expected_unit_cost
  - line_total

Rang buoc nen co:

- unique(po_id, product_id)

### 3.2.3 goods_receipts

- Muc dich: Phieu nhap thuc te theo tung dot giao.
- Cot chinh:
  - id (PK)
  - gr_no (unique), vd: GR-YYYYMMDD-XXXX
  - po_id (FK -> purchase_orders.id)
  - supplier_id (FK -> suppliers.id)
  - warehouse_id (FK -> warehouse.id)
  - receipt_date
  - status (DRAFT, POSTED, CANCELLED)
  - note
  - created_by
  - created_at

Ghi chu:

- 1 PO co nhieu GR.
- Moi GR la 1 dot giao hang.

### 3.2.4 goods_receipt_items

- Muc dich: Chi tiet san pham thuc nhap.
- Cot chinh:
  - id (PK)
  - gr_id (FK -> goods_receipts.id)
  - po_item_id (FK -> purchase_order_items.id, nullable)
  - product_id (FK -> products.id)
  - received_qty
  - unit_cost
  - line_total (generated: received_qty \* unit_cost)

---

## 3.3 Don hang (uu tien POS, san sang Online)

### 3.3.1 orders

- Muc dich: Don hang dung chung cho POS va online trong tuong lai.
- Cot chinh:
  - id (PK)
  - order_no (unique), vd: ORD-YYYYMMDD-XXXX
  - sales_channel (POS, ONLINE)
  - customer_id (FK -> customers.id, nullable)
  - order_time
  - status (DRAFT, COMPLETED, VOID)
  - gross_amount
  - discount_amount
  - coupon_code (nullable)
  - coupon_discount_amount
  - surcharge_amount
  - net_amount
  - payment_method (CASH, BANK_TRANSFER, MIXED, CREDIT)
  - note
  - created_by
  - created_at

Ghi chu:

- Neu payment_method = CREDIT thi customer_id phai co gia tri.
- MVP chua theo doi due date, paid_amount, outstanding_amount.
- Quyet dinh co no hay khong duoc xac dinh boi payment_method.
- discount_amount la so tien giam (>= 0).
- coupon_discount_amount la so tien giam theo ma coupon (>= 0).
- surcharge_amount la so tien thu them (>= 0), vd: phu thu ban no.
- Cong thuc: net_amount = gross_amount - discount_amount - coupon_discount_amount + surcharge_amount.
- coupon_code co the null neu khong ap ma.
- DRAFT duoc giu de xu ly tinh huong cho chuyen khoan: don chua chot co the doi thanh toan, nhan vien van tao duoc don moi cho khach khac.
- Khi VOID co the ghi ly do vao `orders.note` (khong bat buoc).

### 3.3.2 order_items

- Muc dich: Chi tiet dong hang.
- Cot chinh:
  - id (PK)
  - order_id (FK -> orders.id)
  - product_id (FK -> products.id)
  - qty
  - sale_price
  - cost_at_sale
  - line_revenue
  - line_cogs
  - line_profit

Ghi chu:

- cost_at_sale la snapshot avg_cost tai thoi diem ban.
- Bao cao lai lo ve sau khong bi anh huong khi avg_cost thay doi.

---

## 3.4 Tra hang

### 3.4.1 customer_returns

- Muc dich: Phieu khach tra hang (hang nhap lai kho).
- Cot chinh:
  - id (PK)
  - return_no (unique), vd: CR-YYYYMMDD-XXXX
  - customer_id (FK -> customers.id)
  - order_id (FK -> orders.id, nullable)
  - return_date
  - status (DRAFT, POSTED, CANCELLED)
  - note
  - created_by
  - created_at

### 3.4.2 customer_return_items

- Muc dich: Chi tiet san pham khach tra.
- Cot chinh:
  - id (PK)
  - customer_return_id (FK -> customer_returns.id)
  - order_item_id (FK -> order_items.id, nullable)
  - product_id (FK -> products.id)
  - qty
  - refund_amount
  - note

### 3.4.3 supplier_returns

- Muc dich: Phieu tra hang cho NCC (xuat hang ra kho).
- Cot chinh:
  - id (PK)
  - return_no (unique), vd: SR-YYYYMMDD-XXXX
  - supplier_id (FK -> suppliers.id)
  - goods_receipt_id (FK -> goods_receipts.id, nullable)
  - return_date
  - status (DRAFT, POSTED, CANCELLED)
  - note
  - created_by
  - created_at

### 3.4.4 supplier_return_items

- Muc dich: Chi tiet san pham tra NCC.
- Cot chinh:
  - id (PK)
  - supplier_return_id (FK -> supplier_returns.id)
  - goods_receipt_item_id (FK -> goods_receipt_items.id, nullable)
  - product_id (FK -> products.id)
  - qty
  - return_amount
  - note

---

## 3.5 So cai ton kho

### 3.5.1 inventory_movements

- Muc dich: Luu toan bo bien dong ton kho.
- Cot chinh:
  - id (PK)
  - product_id (FK -> products.id)
  - warehouse_id (FK -> warehouse.id)
  - movement_type (PURCHASE_IN, SALE_OUT, RETURN_IN, RETURN_OUT, TRANSFER_IN, TRANSFER_OUT, CONVERSION_IN, CONVERSION_OUT, ADJUST_IN, ADJUST_OUT)
  - qty (luon duong)
  - ref_table (orders, goods_receipts, customer_returns, supplier_returns, stock_adjustments)
  - ref_id (Mã chứng từ - document no)
  - note
  - created_at
  - created_by

Index/rang buoc de xuat:

- index(product_id, created_at)
- index(ref_table, ref_id)
- unique(ref_table, ref_id, product_id) de chong ghi movement trung cua 1 san pham tren 1 phieu.

Ghi chu:

- Transfer la cap movement TRANSFER_OUT + TRANSFER_IN, tong ton toan he thong khong doi.
- Conversion la cap movement CONVERSION_OUT + CONVERSION_IN theo nghiep vu quy doi.
- MVP chua co bang chung tu transfer/conversion, tam ghi nhan bang movement khi can.

---

## 3.6 Kiem ke ton kho

### 3.6.1 stock_adjustments

- Muc dich: Chung tu dieu chinh ton kho theo so kiem ke thuc te.
- Cot chinh:
  - id (PK)
  - adjust_no (unique), vd: ADJ-YYYYMMDD-XXXX
  - warehouse_id (FK -> warehouse.id)
  - adjust_date
  - status (DRAFT, POSTED, CANCELLED)
  - reason (nullable)
  - note (nullable)
  - created_by
  - created_at

### 3.6.2 stock_adjustment_items

- Muc dich: Chi tiet chenh lech ton theo tung san pham.
- Cot chinh:
  - id (PK)
  - adjustment_id (FK -> stock_adjustments.id)
  - product_id (FK -> products.id)
  - system_qty
  - actual_qty
  - diff_qty
  - unit_cost_snapshot
  - note (nullable)

Ghi chu:

- `diff_qty = actual_qty - system_qty`.
- Khi POSTED:
  - neu `diff_qty > 0` tao movement `ADJUST_IN`.
  - neu `diff_qty < 0` tao movement `ADJUST_OUT`.

---

## 4) Quan he nghiep vu chinh

- categories 1-n products
- customers 1-n orders
- staff 1-n cac bang chung tu qua cot created_by
- suppliers 1-n purchase_orders
- coupons 1-n orders (thong qua coupon_code snapshot)
- purchase_orders 1-n purchase_order_items
- purchase_orders 1-n goods_receipts
- goods_receipts 1-n goods_receipt_items
- products 1-n goods_receipt_items
- orders 1-n order_items
- products 1-n order_items
- customer_returns 1-n customer_return_items
- supplier_returns 1-n supplier_return_items
- stock_adjustments 1-n stock_adjustment_items
- products 1-n inventory_movements
- staff 1-n audit_logs (qua actor_staff_id)

---

## 5) Luong nghiep vu can code

## 5.1 Tao va duyet PO

1. Tao PO o trang thai DRAFT.
2. Chot PO -> CONFIRMED.

## 5.2 Nhap hang nhieu dot tu 1 PO

1. Tao GR moi cho tung dot giao.
2. Nhap goods_receipt_items theo so thuc nhan.
3. Khi POSTED GR:
   - Tao movement PURCHASE_IN cho tung dong.
   - Tang on_hand.
   - Tinh lai avg_cost bang Moving Average.
4. Cap nhat PO:
   - Neu tong da nhan < tong dat: PARTIAL_RECEIVED.
   - Neu tong da nhan = tong dat: FULL_RECEIVED.

## 5.3 Xu ly don hang (POS truoc, online sau)

1. Tao order DRAFT.
2. Them dong hang.
3. Neu co coupon:
   - Validate coupon con hieu luc/is_active/dat dieu kien min_order.
   - Tinh coupon_discount_amount.
4. Khi COMPLETE:
   - Kiem tra du ton.
   - Snapshot cost_at_sale = products.avg_cost.
   - Tao movement SALE_OUT.
   - Tru on_hand.
5. Neu ban no: dat payment_method = CREDIT, luu customer_id.
6. Neu dang cho chuyen khoan: giu DRAFT, nhan vien mo don DRAFT moi de tiep khach tiep theo.
7. Neu VOID order:
   - Co the nhap ly do vao `orders.note`.
   - Ghi 1 dong vao `audit_logs` voi `action = STATUS_CHANGE` (old_status/new_status).
   - Neu old_status = COMPLETED thi chi ADMIN duoc phep VOID.

## 5.4 Khach tra hang

1. Tao customer_return DRAFT.
2. Nhap customer_return_items.
3. Khi POSTED:
   - Tao movement RETURN_IN.
   - Tang on_hand.

## 5.5 Tra hang cho NCC

1. Tao supplier_return DRAFT.
2. Nhap supplier_return_items.
3. Khi POSTED:
   - Tao movement RETURN_OUT.
   - Tru on_hand.

## 5.6 Kiem ke ton kho

1. Tao stock_adjustment DRAFT.
2. Nhap stock_adjustment_items.
3. Khi POSTED:
   - Tao movement ADJUST_IN/ADJUST_OUT theo diff_qty.
   - Cap nhat on_hand.

## 5.7 Transfer va Conversion (de mo rong)

1. Transfer:
   - Luon di theo cap movement TRANSFER_OUT va TRANSFER_IN.
   - Muc dich chinh la theo doi luong chuyen, khong lam tang/giam tong ton he thong.
2. Conversion:
   - Luon di theo cap movement CONVERSION_OUT va CONVERSION_IN.
   - Dung cho quy doi dong goi/qui cach.

---

## 6) Rule ky thuat quan trong

- Moi thao tac POSTED/COMPLETED phai chay trong transaction.
- Khong update on_hand truc tiep tu API ngoai movement service.
- Dung unique(ref_table, ref_id, product_id) de dam bao idempotent.
- Khong cho on_hand am neu khong bat che do ban am.
- So chung tu auto-generate theo ngay.
- Validate role FK:
  - customer_id phai ton tai trong bang customers.
  - supplier_id phai ton tai trong bang suppliers.
  - created_by phai la staff role SALES_STAFF/WAREHOUSE_STAFF/ADMIN.

## 6.1 Authorization Rules (MVP)

| Nghiep vu                                       | SALES_STAFF | WAREHOUSE_STAFF | ADMIN |
| ----------------------------------------------- | ----------- | --------------- | ----- |
| Tao/sua order DRAFT (POS)                       | Co          | Khong           | Co    |
| COMPLETE order                                  | Co          | Khong           | Co    |
| VOID order khi old_status = DRAFT               | Co          | Khong           | Co    |
| VOID/CANCELLED order khi old_status = COMPLETED | Khong       | Khong           | Co    |
| Tao customer_return DRAFT                       | Co          | Co              | Co    |
| POSTED customer_return                          | Khong       | Co              | Co    |
| Tao/sua/CONFIRMED purchase_order                | Khong       | Co              | Co    |
| Tao goods_receipt DRAFT                         | Khong       | Co              | Co    |
| POSTED goods_receipt                            | Khong       | Co              | Co    |
| Tao supplier_return DRAFT                       | Khong       | Co              | Co    |
| POSTED supplier_return                          | Khong       | Co              | Co    |
| Tao stock_adjustment DRAFT                      | Khong       | Co              | Co    |
| POSTED stock_adjustment                         | Khong       | Co              | Co    |
| VOID/CANCELLED chung tu da POSTED               | Khong       | Khong           | Co    |
| Quan ly staff/coupons/master data               | Khong       | Khong           | Co    |

- SALES_STAFF:
  - Duoc tao order DRAFT, sua DRAFT, COMPLETE order (sales_channel = POS).
  - Co the VOID order chi khi old_status = DRAFT.
  - Duoc tao customer_return DRAFT.
  - Khong duoc tao/sua/POSTED purchase_order, goods_receipt, supplier_return, stock_adjustment.
  - Khong duoc VOID/CANCELLED chung tu neu old_status = COMPLETED hoac POSTED.

- WAREHOUSE_STAFF:
  - Duoc tao/sua/CONFIRMED purchase_orders.
  - Duoc tao va POSTED goods_receipts.
  - Duoc tao va POSTED customer_returns, supplier_returns.
  - Duoc tao va POSTED stock_adjustments.
  - Khong duoc VOID order POS.
  - Khong duoc VOID/CANCELLED chung tu neu old_status = COMPLETED hoac POSTED.

- ADMIN:
  - Co toan quyen tren tat ca chuc nang.
  - Duoc quan ly staff, coupons, master data va override xu ly ngoai le.
  - La role duy nhat duoc phep VOID/CANCELLED chung tu da o trang thai COMPLETED hoac POSTED.

- Quy tac chung:
  - Moi hanh dong thay doi trang thai phai ghi vao bang `audit_logs` voi `action = STATUS_CHANGE`.
  - VOID order POS co the ghi ly do vao `orders.note` va/hoac `audit_logs.reason` (khong bat buoc).
  - Rule uu tien cao: transition tu COMPLETED/POSTED sang VOID/CANCELLED chi ADMIN duoc thuc hien.

---

## 7) Bao cao MVP co the co ngay

- Ton kho hien tai theo san pham: products.on_hand, products.avg_cost.
- Nhat ky xuat nhap ton: inventory_movements.
- Doanh thu theo ngay: orders + order_items (loc sales_channel = POS neu can).
- Loi nhuan gop theo don va theo san pham: dua tren cost_at_sale.
- Danh sach don ban no tam thoi: loc orders co payment_method = CREDIT.
- Bao cao tra hang: customer*returns, supplier_returns va inventory_movements theo movement_type RETURN*\*.
- Bao cao transfer va conversion: inventory*movements theo movement_type TRANSFER*\_ va CONVERSION\_\_.

---

## 8) Goi y migration thu tu cho project moi

1. 001_master_tables (categories, customers, staff, suppliers, products, warehouse, coupons)
2. 002_purchase_orders
3. 003_goods_receipts
4. 004_orders
5. 005_returns_documents
6. 006_inventory_movements
7. 007_stock_adjustments
8. 008_indexes_constraints_views

---

## 9) Ket luan

Bo schema tren giu duoc su don gian cho MVP, nhung van dung nghiep vu cho bai toan:

- POS ban tai cua hang.
- Nhap hang nhieu dot tu PO.
- Co xu ly tra hang 2 chieu (khach tra va tra NCC).
- Co enum de mo rong transfer va conversion.
- Quan ly ton kho va gia von theo Moving Average.

Khi can nang cap sau MVP, co the mo rong theo huong:

- cong no khach hang chi tiet (bang thu no, phieu thu, doi tru),
- cong no NCC,
- nhieu kho,
- lo/han dung,
- FIFO.
