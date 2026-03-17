# Kế hoạch triển khai Backend (Spring Boot + Supabase + Flyway)

Hệ thống Backend sẽ đóng vai trò trung tâm xử lý logic nghiệp vụ, giao tiếp với cơ sở dữ liệu (Supabase/PostgreSQL) và cung cấp REST API cho ứng dụng React Native.

## 1. Khởi tạo dự án & Cấu hình môi trường
- **Spring Boot**: Khởi tạo project (dùng Maven với `pom.xml`) với các dependency: `Spring Web`, `Spring Data JPA`, `PostgreSQL Driver`, `Flyway Migration`, `Lombok`, `Validation`, `Spring Security` (để quản lý JWT).
- **Supabase**: Thiết lập cấu hình kết nối DB Supabase/PostgreSQL trong file `application.properties`.
- **Flyway**: Thiết lập cấu hình Flyway trong Spring Boot để tự động chạy các script SQL.


## 2. Thiết kế Database Migration (Flyway)
Viết các file SQL (V1 -> V8) theo chuẩn Flyway tương ứng với file [MVP_POS_WAREHOUSE_SCHEMA.md](file:///g:/QuanLyKho/MVP_POS_WAREHOUSE_SCHEMA.md):
- `V1__init_master_tables.sql`: categories, customers, staff, suppliers, products, warehouse, coupons, audit_logs.
- `V2__init_purchase_orders.sql`: purchase_orders, purchase_order_items.
- `V3__init_goods_receipts.sql`: goods_receipts, goods_receipt_items.
- `V4__init_orders.sql`: orders, order_items.
- `V5__init_returns_documents.sql`: customer_returns, supplier_returns.
- `V6__init_inventory_movements.sql`: inventory_movements.
- `V7__init_stock_adjustments.sql`: stock_adjustments, stock_adjustment_items.
- `V8__add_indexes.sql`: Các index và constraint cần thiết.

## 3. Xây dựng Data Access Layer (Entities & Repositories)
- **Entities**: Ánh xạ (mapping) các bảng Database thành các class Java (sử dụng `@Entity`, `@Table`, `@Id`, cài đặt quan hệ OneToMany, ManyToOne).
- **Repositories**: Tạo các interface kế thừa `JpaRepository` cho từng Entity để thực hiện các thao tác CRUD.

## 4. Cấu hình Security (Custom JWT & BCrypt)
- Tích hợp Spring Security và thư viện tạo JWT (ví dụ: `jjwt`).
- Xây dựng luồng Đăng nhập (Login): API nhận `username` và `password`, sau đó query bảng `staff` và dùng `BCrypt` để kiểm tra `password_hash`.
- Nếu hợp lệ, hệ thống Backend sẽ tự sinh ra JWT token chứa thông tin `staff_id` và `role` trả về cho React Native app.
- Viết JWT Filter để chặn các request API tiếp theo, đọc token từ header `Authorization` (Bearer token), xác thực chữ ký của chính Backend và phân quyền thông qua `@PreAuthorize("hasRole('ADMIN')")` v.v.

## 5. Xây dựng Business Logic Layer (Services)
Xử lý các logic cốt lõi. **Đặc biệt lưu ý các thao tác thay đổi kho phải nằm trong `@Transactional`**:
- **Product & Inventory Service**: Tính giá vốn trung bình (Moving Average), lưu snapshot.
- **Purchase & Receipt Service**: Tạo PO, chuyển trạng thái PO, nhận hàng (Goods Receipt) và sinh `inventory_movements` (PURCHASE_IN).
- **Order Service**: Phục vụ API gọi từ POS, kiểm tra tồn kho, áp dụng coupon, lưu snapshot giá vốn `cost_at_sale`, sinh movement `SALE_OUT`.
- **Return Service**: Xử lý khách trả hàng (quản lý `RETURN_IN`) và xuất trả NCC (`RETURN_OUT`).
- **Stock Adjustment Service**: Sinh phiếu kiểm kê và cập nhật chênh lệch tồn kho (`ADJUST_IN`/`ADJUST_OUT`).
- **Audit Logging Aspect/Service**: Tự động bắn log vào `audit_logs` khi có hành động đổi trạng thái chứng từ (STATUS_CHANGE).

## 6. Xây dựng API Layer (Controllers)
- Xây dựng các REST API Controller định tuyến dữ liệu.
- Định nghĩa DTOs (Data Transfer Objects) cho luồng input/output, và áp dụng Validations (VD: `@Valid`, `@NotNull`).
- Tạo và sử dụng `GlobalExceptionHandler` để gom mọi lỗi (ví dụ: lỗi nghiệp vụ không đủ hàng tồn, lỗi dữ liệu, lỗi auth) về chung một cấu trúc JSON JSON (cấu trúc ErrorResponse) để React Native dễ dàng đón lỗi và thiết kế giao diện hiển thị.

## User Review Required
> [!IMPORTANT]
> - Đây là bản thiết kế và định hướng công việc. Bạn xem qua file kế hoạch và [task.md](file:///C:/Users/Hyzu/.gemini/antigravity/brain/055b9beb-47f5-404b-b121-f7b4c7cade5f/task.md).
> - Cấu hình Auth đã được cập nhật thành **Spring Boot tự quản lý JWT và Password (BCrypt)** để khớp với dữ liệu `password_hash` trong bảng `staff`. Supabase ở dự án này sẽ chỉ đơn thuần đóng vai trò là một Database PostgreSQL.
> - Nếu bạn đồng ý, chúng ta sẽ bắt đầu từ **Phase 1: Tạo dự án Spring Boot và viết cấu trúc database Flyway**.
