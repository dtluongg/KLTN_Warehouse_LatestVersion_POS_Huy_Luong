# 📋 Nhật ký cập nhật — CRUD Form & Chống trùng dữ liệu

> **Ngày:** 22/04/2026  
> **Nhánh Git:** `dev-huy`  
> **Commit:** `41d90c0` — *"refactor frontend, crud meta data, chong trung username, sku, barcode"*

---

## 1. Tổng quan phiên làm việc

Phiên này tập trung vào **hoàn thiện giao diện CRUD** cho 6 module master data (Category, Product, Coupon, Staff, Customer, Warehouse, Supplier) và **bảo vệ tính toàn vẹn dữ liệu** ở backend bằng các validation chống trùng lặp.

---

## 2. Backend

### 2.1 Auto-sinh mã định danh bằng PostgreSQL TRIGGER

**File mới:** `V18__auto_gen_entity_codes.sql`

Tạo 3 trigger PostgreSQL tự động sinh mã khi `INSERT` mà không truyền giá trị:

| Bảng | Cột | Format | Ví dụ |
|---|---|---|---|
| `customers` | `customer_code` | `KH-XXXXX` | `KH-00001` |
| `staff` | `staff_code` | `NV-XXXXX` | `NV-00001` |
| `suppliers` | `supplier_code` | `NCC-XXXXX` | `NCC-00001` |

**Cơ chế:**
- Lấy MAX số hiện tại → +1 → `LPAD` đủ 5 chữ số
- Nếu vượt 5 chữ số (> 99999) thì tự mở rộng thành 6, 7,... chữ số tự nhiên
- Trigger chỉ kích hoạt khi cột = `NULL` → vẫn cho phép set thủ công

**Thay đổi DTO bỏ `@NotBlank` trên các trường code:**
- `CustomerRequestDTO.customerCode` — bỏ bắt buộc nhập
- `StaffRequestDTO.staffCode` — bỏ bắt buộc nhập
- `SupplierRequestDTO.supplierCode` — bỏ bắt buộc nhập

**Thay đổi Service:`createXxx()` truyền `null` cho trường code:**
- `CustomerServiceImpl.createCustomer()` → `.customerCode(null)`
- `StaffServiceImpl.createStaff()` → `.staffCode(null)`
- `SupplierServiceImpl.createSupplier()` → `.supplierCode(null)`

---

### 2.2 Chống trùng lặp dữ liệu

#### Staff — Username
**File:** `StaffRepository.java`
```java
boolean existsByUsernameAndIdNot(String username, Long id);
```

**File:** `StaffServiceImpl.java`
- `createStaff()`: đã có check `findByUsername` từ trước ✅
- `updateStaff()`: **mới thêm** — check `existsByUsernameAndIdNot` để đảm bảo không đổi sang username đã tồn tại ở NV khác
- Đã bỏ `staff.setStaffCode(request.getStaffCode())` trong `updateStaff` (code là readonly)

#### Product — SKU & Barcode
**File:** `ProductRepository.java` — thêm 4 method:
```java
boolean existsBySkuAndDeletedAtIsNull(String sku);
boolean existsBySkuAndIdNotAndDeletedAtIsNull(String sku, Long id);
boolean existsByBarcodeAndDeletedAtIsNull(String barcode);
boolean existsByBarcodeAndIdNotAndDeletedAtIsNull(String barcode, Long id);
```

**File:** `ProductServiceImpl.java`
- `createProduct()`: check SKU trùng + check Barcode trùng (chỉ khi barcode có giá trị)
- `updateProduct()`: check SKU trùng với sản phẩm *khác* + check Barcode trùng với sản phẩm *khác*

---

## 3. Frontend

### 3.1 Tạo mới 7 Form Screen (trang đầy đủ, giống PurchaseOrderFormScreen)

Tất cả các form đều có:
- Header với nút Back
- ScrollView với card(s) chứa các trường nhập liệu
- Footer với nút Submit cố định dưới cùng
- Loading indicator khi fetch dữ liệu (edit mode)
- Xử lý lỗi báo `Alert`

| File | Route | Tính năng đặc biệt |
|---|---|---|
| `CategoryFormScreen.tsx` | `CategoryForm` | Auto-sinh slug khi gõ tên (create), nút ⚡ Tự sinh slug (edit) |
| `ProductFormScreen.tsx` | `ProductForm` | Modal chọn danh mục có tìm kiếm, nút ⚡ Tự sinh SKU từ tên |
| `CouponFormScreen.tsx` | `CouponForm` | Picker Loại giảm (% / VND), tự uppercase mã coupon |
| `StaffFormScreen.tsx` | `StaffForm` | Picker 3 Role, ẩn/hiện mật khẩu, khóa username khi sửa |
| `CustomerFormScreen.tsx` | `CustomerForm` | UUID làm ID, layout 2 cột SĐT/MST |
| `WarehouseFormScreen.tsx` | `WarehouseForm` | Textarea địa chỉ, mã kho |
| `SupplierFormScreen.tsx` | `SupplierForm` | Mới tạo từ đầu (chưa có form trước đó) |

---

### 3.2 Quy tắc hiển thị ô Mã định danh (readonly)

Áp dụng cho `CustomerFormScreen`, `StaffFormScreen`, `SupplierFormScreen`:

| Trạng thái | Hiển thị | Chỉnh sửa |
|---|---|---|
| **Tạo mới** | Ô xám, placeholder *"Tự động sinh sau khi lưu"* | ❌ Khóa |
| **Chỉnh sửa** | Ô xám, hiện mã thật (`KH-00001`) | ❌ Khóa |

CSS: `inputLocked: { backgroundColor: theme.colors.muted, color: theme.colors.mutedForeground }`

---

### 3.3 Cập nhật 7 List Screen — Thay Alert bằng navigation

Trước đây các nút Thêm/Sửa chỉ hiện `Alert.alert` placeholder. Đã cập nhật để navigate đến form screen:

| List Screen | Thêm | Sửa |
|---|---|---|
| `CategoryListScreen` | → `CategoryForm` | → `CategoryForm?id={id}` |
| `ProductListScreen` | → `ProductForm` | → `ProductForm?id={id}` |
| `CouponListScreen` | → `CouponForm` | → `CouponForm?id={id}` |
| `StaffListScreen` | → `StaffForm` | → `StaffForm?id={id}` |
| `CustomerListScreen` | → `CustomerForm` | → `CustomerForm?id={id}` |
| `WarehouseListScreen` | → `WarehouseForm` | → `WarehouseForm?id={id}` |
| `SupplierListScreen` | → `SupplierForm` | → `SupplierForm?id={id}` |

---

### 3.4 Đăng ký Routes trong AppNavigator

**File:** `AppNavigator.tsx`

Import và thêm vào `Stack.Navigator` 8 route mới:
```
SupplierForm, CategoryForm, ProductForm, CouponForm, StaffForm, CustomerForm, WarehouseForm
```
Tất cả dùng `options={{ headerShown: false }}` để form tự quản lý header.

---

### 3.5 Nút ⚡ Tự sinh

#### SKU (ProductFormScreen)
- Nút xuất hiện cạnh ô SKU
- Logic: lấy chữ cái đầu từng từ của **Tên sản phẩm** + 4 ký tự random từ `Date.now().toString(36)`
- Ví dụ: *"Thuốc Bảo Vệ Thực Vật"* → `TBVTV-M8X2`

#### Slug (CategoryFormScreen)
- Khi **tạo mới**: slug tự động tạo theo tên khi người dùng gõ
- Khi **sửa**: nút ⚡ Tự sinh → regenerate từ tên hiện tại
- Logic: lowercase → bỏ dấu → bỏ ký tự đặc biệt → thay space bằng `-`

---

### 3.6 Sửa lỗi StaffFormScreen

| Vấn đề | Nguyên nhân | Fix |
|---|---|---|
| Username bị khóa khi tạo mới | Hiểu nhầm `editable={!isEdit}` | Đã xác nhận đúng: `false` khi sửa, `true` khi tạo mới |
| 4 role thay vì 3 | Thêm nhầm `ACCOUNTANT` | Bỏ, chỉ giữ `ADMIN`, `WAREHOUSE_STAFF`, `SALES_STAFF` |
| Tham chiếu `staffCode` chưa khai báo | Biến bị thiếu sau refactor | Thêm `const [staffCode, setStaffCode] = useState("")` |

---

## 4. Luồng hoạt động tổng thể sau cập nhật

```
[List Screen]
  → Nhấn "Thêm" → navigate("XxxForm")           → [Form Screen - Create Mode]
  → Nhấn "Sửa"  → navigate("XxxForm", { id })    → [Form Screen - Edit Mode]
                                                        ↓ fetch GET /api/xxx/{id}
                                                        ↓ điền form
                                                        ↓ Submit
                                                         → POST /api/xxx  (tạo mới)
                                                         → PUT  /api/xxx/{id} (cập nhật)
                                                        ↓ navigation.goBack()
```

---

## 5. Danh sách file thay đổi chính

### Backend
```
backend/src/main/resources/db/migration/V18__auto_gen_entity_codes.sql   [MỚI]
backend/.../dto/customer/CustomerRequestDTO.java                          [SỬA]
backend/.../dto/staff/StaffRequestDTO.java                                [SỬA]
backend/.../dto/supplier/SupplierRequestDTO.java                          [SỬA]
backend/.../repository/ProductRepository.java                             [SỬA]
backend/.../repository/StaffRepository.java                               [SỬA]
backend/.../service/impl/ProductServiceImpl.java                          [SỬA]
backend/.../service/impl/StaffServiceImpl.java                            [SỬA]
backend/.../service/impl/CustomerServiceImpl.java                         [SỬA]
backend/.../service/impl/SupplierServiceImpl.java                         [SỬA]
```

### Frontend
```
frontend/src/features/categories/screens/CategoryFormScreen.tsx           [MỚI]
frontend/src/features/products/screens/ProductFormScreen.tsx              [MỚI]
frontend/src/features/coupons/screens/CouponFormScreen.tsx                [MỚI]
frontend/src/features/staff/screens/StaffFormScreen.tsx                   [MỚI]
frontend/src/features/customers/screens/CustomerFormScreen.tsx            [MỚI]
frontend/src/features/warehouses/screens/WarehouseFormScreen.tsx          [MỚI]
frontend/src/features/suppliers/screens/SupplierFormScreen.tsx            [MỚI]

frontend/src/features/categories/screens/CategoryListScreen.tsx           [SỬA]
frontend/src/features/products/screens/ProductListScreen.tsx              [SỬA]
frontend/src/features/coupons/screens/CouponListScreen.tsx                [SỬA]
frontend/src/features/staff/screens/StaffListScreen.tsx                   [SỬA]
frontend/src/features/customers/screens/CustomerListScreen.tsx            [SỬA]
frontend/src/features/warehouses/screens/WarehouseListScreen.tsx          [SỬA]
frontend/src/features/suppliers/screens/SupplierListScreen.tsx            [SỬA]

frontend/src/navigation/AppNavigator.tsx                                  [SỬA]
```

---

## 6. Ghi chú & Lưu ý kỹ thuật

- **Trigger SQL** chỉ chạy khi `INSERT`, không ảnh hưởng `UPDATE` → mã một khi đã sinh sẽ không tự đổi
- **Barcode** là optional — validation trùng chỉ kích hoạt khi trường có giá trị (không phải null/empty)
- **updateStaff** đã bỏ `staff.setStaffCode(...)` → staffCode không thể thay đổi sau khi tạo
- **ProductListScreen** hiển thị thêm cột `avgCost`, `lastPurchaseCost` nếu API trả về
- Tất cả form dùng pattern: header tự quản lý (không dùng navigation header mặc định)
- Khi backend trả lỗi trùng dữ liệu, frontend hiện `Alert.alert("Lỗi", message)` với nội dung tiếng Việt rõ ràng

---

*Cập nhật bởi: Huy — 22/04/2026*
