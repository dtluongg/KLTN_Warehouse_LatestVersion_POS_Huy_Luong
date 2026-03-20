# Kế hoạch thực hiện Frontend (Task To-Do List)

- [x] **Phase 1: Khởi tạo và Cấu hình Base**
  - [x] Chạy lệnh `npx create-expo-app` để tạo framework.
  - [x] Cài đặt các thư viện cần thiết: `axios`, `react-navigation`, `zustand`, `expo-secure-store`.
  - [x] Tổ chức bộ khung thư mục (`api`, `screens`, `navigation`, `store`).

- [x] **Phase 2: Xác thực (Authentication)**
  - [x] Cấu hình Axios Interceptor để inject JWT Token vào header.
  - [x] Tạo `AuthStore` (zustand) để lưu trạng thái đăng nhập.
  - [x] Code UI màn hình **LoginScreen**.
  - [x] Ghép API Login.

- [/] **Phase 3: Bán hàng (POS System)**
  - [x] Màn hình trang chủ liệt kê danh sách Sản phẩm (Grid Layout).
  - [x] Component Giỏ hàng (Tăng/giảm số lượng món).
  - [ ] Form Nhập mã giảm giá và xác nhận thanh toán.
  - [ ] Ghép API `GET /products` và `POST /api/orders`.

- [ ] **Phase 4: Nhập kho & Tồn kho (Inventory)**
  - [ ] Màn hình hiển thị danh sách Phiếu Nhập (Goods Receipt).
  - [ ] Form tạo Phiếu Nhập (Nhập từ cấu trúc PO có sẵn hoặc tự do).
  - [ ] Màn hình Kiểm kê (Stock Adjustments).
  - [ ] Ghép API Cân kho, Nhập kho.

- [ ] **Phase 5: Master Data & Hoàn thiện**
  - [ ] Màn hình danh sách Khách hàng & tạo Khách hàng.
  - [ ] Đánh bóng UI (Màu sắc, Font chữ, hiển thị số tiền VND).
  - [ ] Test luồng End-to-End từ App -> Backend -> Database.
