# Kế Hoạch Phát Triển Frontend (React Native - Expo)

Dự án Frontend sẽ là một ứng dụng di động dành cho NV Bán Hàng (POS) và Thủ Kho (Warehouse), kết nối trực tiếp với Backend Spring Boot REST API.

## 1. Công nghệ & Thư viện
- **Core:** React Native (sử dụng **Expo** để khởi tạo và chạy nhanh).
- **Ngôn ngữ:** TypeScript (Giúp code chặt chẽ, dễ debug).
- **Điều hướng (Navigation):** React Navigation (Stack & Tab Navigator).
- **Gọi API:** `axios` (Cấu hình Interceptor để tự động gắn JWT Token).
- **Quản lý state:** `zustand` (Nhẹ và dễ dùng hơn Redux, phù hợp ứng dụng POS).
- **CSS / UI:** Sử dụng `StyleSheet` mặc định hoặc `React Native Paper` cho UI components (Card, Button, Input).
- **Lưu trữ Token:** `expo-secure-store` hoặc `AsyncStorage`.

## 2. Kiến trúc thư mục (Dự kiến)
```text
frontend/
 ├── src/
 │    ├── api/          # Cấu hình axios và các file gọi API (authApi, productApi,...)
 │    ├── components/   # Các UI component dùng chung (Button, Input, Header)
 │    ├── navigation/   # Cấu hình React Navigation (MainTab, AuthStack)
 │    ├── screens/      # Các màn hình chính (Login, Home, POS, Inventory,...)
 │    ├── store/        # Quản lý state bằng Zustand (authStore, cartStore)
 │    ├── types/        # Định nghĩa TypeScript Interfaces (Product, Order,...)
 │    └── utils/        # Các hàm tiện ích (format tiền tệ, ngày tháng)
 ├── App.tsx            # Entry point của ứng dụng
 ├── app.json           # Cấu hình Expo
 └── package.json       # Chứa các dependencies
```

## 3. Các Luồng Màn Hình (Screens Flow)
### 3.1. Auth Flow
- **Login Screen:** Nhập Username/Password -> Gọi API Login -> Lưu JWT Token tào Store -> Chuyển sang Main Flow.

### 3.2. Main Flow (Dựa theo Role sau này, MVP hiển thị chung)
- **Tab 1: Bán Hàng (POS)**
  - Chọn sản phẩm (Search/Scan barcode).
  - Thêm vào giỏ hàng, nhập số lượng.
  - Áp dụng mã giảm giá.
  - Chốt đơn & Thanh toán (Tạo Order).
- **Tab 2: Quản lý Kho (Inventory)**
  - Danh sách Hàng hóa.
  - Tạo Phiếu Nhập Kho (Goods Receipt) từ PO.
  - Tạo Phiếu Kiểm Kho (Stock Adjustment).
- **Tab 3: Đối tác (Master Data)**
  - Quản lý Khách hàng.
  - Quản lý Nhà cung cấp (Supplier).
- **Tab 4: Cài đặt / Tài khoản**
  - Hiển thị thông tin user đang đăng nhập.
  - Nút Đăng xuất.

## 4. Quá trình Triển khai (Phases)
- **Phase 1:** Khởi tạo Expo, cài đặt dependencies, setup Navigation & Axios Interceptor.
- **Phase 2:** Luồng Đăng Nhập (Auth Flow) & Lưu JWT.
- **Phase 3:** Màn hình POS & Giỏ hàng (Tạo Order).
- **Phase 4:** Màn hình Kho (Nhập hàng, Cân kho, Liệt kê sản phẩm).
- **Phase 5:** Hoàn thiện UI/UX và ghép API các phần còn lại.
