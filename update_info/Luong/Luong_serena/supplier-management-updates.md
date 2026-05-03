# Supplier Management - Tất cả Cập nhật (May 3, 2026)

## 🎯 Tóm Tắt Thay Đổi

Cập nhật toàn bộ hệ thống quản lý Nhà Cung Cấp (NCC) và Sản phẩm NCC với quyền hạn chỉ **ADMIN**.

---

## 🔧 Backend Updates

### 1. **SupplierController** (`/api/suppliers`)
- **GET** `/api/suppliers` - Lấy danh sách NCC (public read)
- **GET** `/api/suppliers/{id}` - Lấy chi tiết NCC (public read)
- **POST** `/api/suppliers` - ✅ **@PreAuthorize("hasAnyRole('ADMIN')") - Tạo NCC**
- **PUT** `/api/suppliers/{id}` - ✅ **@PreAuthorize("hasAnyRole('ADMIN')") - Cập nhật NCC**
- **DELETE** `/api/suppliers/{id}` - ✅ **@PreAuthorize("hasRole('ADMIN')") - Xóa NCC**

### 2. **SupplierProductController** (`/api/supplier-products`)
- **GET** `/by-supplier/{id}` - `@PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")` (READ)
- **GET** `/by-product/{id}` - `@PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")` (READ)
- **POST** - ✅ **@PreAuthorize("hasRole('ADMIN')") - Thêm SP vào bảng giá NCC**
- **PUT** `/{id}` - ✅ **@PreAuthorize("hasRole('ADMIN')") - Cập nhật giá SP**
- **DELETE** `/{id}` - ✅ **@PreAuthorize("hasRole('ADMIN')") - Xóa SP khỏi bảng giá NCC**

### 3. **SupplierServiceImpl** - Logic không thay đổi
- `createSupplier()`: supplierCode = null → SQL trigger sinh NCC-XXXXX
- `updateSupplier()`: **FIX** - Không ghi đè supplierCode (backend vẫn gán request.getSupplierCode() nhưng frontend không gửi lên khi edit)

### 4. **SupplierProductServiceImpl** - Logic không thay đổi
- `create()`: Kiểm tra duplicate, nếu inactive thì reactivate
- `update()`: Cập nhật standardPrice + isActive, set lastUpdatedAt
- `delete()`: Xóa vật lý khỏi DB

---

## 🎨 Frontend Updates

### 1. **SupplierFormScreen.tsx** - Chỉ ADMIN quản lý sản phẩm NCC

**Imports thêm:**
```tsx
import { useAuthStore } from "../../../store/authStore";
import { Role } from "../../../types";
```

**State thêm:**
```tsx
const userRole = useAuthStore(state => state.role);
const isAdmin = userRole === Role.ADMIN;

// Edit supplier product
const [showEditProductModal, setShowEditProductModal] = useState(false);
const [editingProductId, setEditingProductId] = useState<number | null>(null);
const [editingPrice, setEditingPrice] = useState("");
const [updatingProduct, setUpdatingProduct] = useState(false);
```

**Hàm mới:**
- `handleEditProduct(sp)` - Mở modal chỉnh sửa giá
- `handleUpdateProduct()` - Gọi `updateSupplierProduct()` để cập nhật giá

**Fix lỗi submit:**
```tsx
const payload = {
    ...(isEdit ? {} : { supplierCode: null }),  // Chỉ gửi khi tạo mới
    name, phone, taxCode, address, isActive,
};
```

**Conditionally render:**
- Supplier Products section chỉ hiển thị nếu: `isEdit && isAdmin`
- Info card hiển thị nếu: `isEdit && !isAdmin` (thông báo quyền)
- Add/Edit/Delete buttons chỉ hiển thị cho ADMIN

**Modal mới:**
- Modal "Cập nhật giá sản phẩm" với input giá + xác nhận/hủy

**Style thêm:**
- `infoCard` - Thông báo quyền hạn cho non-admin
- `spEditBtn` - Icon edit button

---

## 📋 SupplierProductApi.ts - Không thay đổi
```tsx
- getProductsBySupplier(supplierId)
- getSuppliersByProduct(productId)
- createSupplierProduct(data)
- updateSupplierProduct(id, data) ← Sử dụng cho chỉnh sửa giá
- deleteSupplierProduct(id)
```

---

## 🔐 Quyền Hạn Tóm Tắt

| Chức năng | ADMIN | WAREHOUSE_STAFF | SALES_STAFF |
|-----------|-------|-----------------|-------------|
| Xem danh sách NCC | ✅ | ✅ | ✅ |
| Xem chi tiết NCC | ✅ | ✅ | ✅ |
| Tạo NCC | ✅ | ❌ | ❌ |
| Sửa NCC | ✅ | ❌ | ❌ |
| Xóa NCC | ✅ | ❌ | ❌ |
| Xem sản phẩm NCC | ✅ | ✅ | ❌ |
| Thêm SP vào NCC | ✅ | ❌ | ❌ |
| Cập nhật giá SP NCC | ✅ | ❌ | ❌ |
| Xóa SP khỏi NCC | ✅ | ❌ | ❌ |

---

## 📁 Files Đã Thay Đổi

### Backend:
1. `SupplierController.java` - Quyền hạn POST/PUT/DELETE
2. `SupplierProductController.java` - Quyền hạn POST/PUT/DELETE = ADMIN only

### Frontend:
1. `SupplierFormScreen.tsx` - Role check, Edit modal, Info card
2. `supplierProductApi.ts` - No changes (wrapper already exists)

### Không thay đổi nhưng liên quan:
- `SupplierService.java` - Interface
- `SupplierServiceImpl.java` - Implement logic
- `SupplierProductService.java` - Interface
- `SupplierProductServiceImpl.java` - Implement logic
- `SupplierReturnController.java` - Warehouse staff + admin = tạo/sửa/duyệt phiếu trả hàng
- `SupplierRepository.java` - Soft delete (deletedAt)
- `SupplierProductRepository.java` - Query methods

---

## ✅ Kiểm Tra Hoạt Động

### Khi ADMIN edit NCC:
1. ✅ Xem danh sách sản phẩm NCC (Supplier Products section)
2. ✅ Click nút "Thêm SP" → Modal chọn sản phẩm + nhập giá
3. ✅ Click nút Edit (icon bút) → Modal cập nhật giá
4. ✅ Click nút Delete → Xác nhận xóa
5. ✅ Mã NCC được giữ nguyên khi cập nhật (không ghi đè)

### Khi WAREHOUSE_STAFF/SALES_STAFF edit NCC:
1. ✅ Không thấy section "Sản phẩm cung cấp"
2. ✅ Thấy thông báo: "Chỉ quản trị viên có quyền quản lý sản phẩm của nhà cung cấp"

---

## 🐛 Bug Fix

### Fix 1: Cập nhật NCC ghi đè mã NCC
**Vấn đề:** Frontend gửi `supplierCode: null` lên, backend set lại thành null
**Giải pháp:** Frontend chỉ gửi supplierCode khi tạo mới, không gửi khi sửa
```tsx
...(isEdit ? {} : { supplierCode: null })
```

### Fix 2: Lỗi escape string trong TypeScript
**Vấn đề:** `useState(\"\")` bị escape sai
**Giải pháp:** Sửa thành `useState("")`

### Fix 3: Không thể cập nhật giá sản phẩm NCC
**Vấn đề:** Frontend chỉ có thêm/xóa, không có chỉnh sửa
**Giải pháp:** Thêm modal edit + button edit trên mỗi sản phẩm

---

## 📝 Notes
- Supplier code tự sinh bởi SQL trigger (format: NCC-XXXXX)
- Soft delete cho Supplier (deletedAt field)
- Supplier Products là bảng giá tham khảo, không hard delete
- WAREHOUSE_STAFF có thể xem sản phẩm NCC (để tạo PO) nhưng không quản lý
- Role check được thực hiện ở 2 cấp: Backend (API) + Frontend (UI)



## 🔁 2026-05-03 - Additional Backend Fixes Applied

- `SupplierServiceImpl.updateSupplier`: now only updates `supplierCode` when the request includes a non-empty value; prevents accidental overwrites of SQL-generated codes.
- `SupplierProductServiceImpl.delete`: changed to soft-delete by setting `isActive=false` and updating `lastUpdatedAt` instead of hard delete to avoid FK/delete failures and preserve history.

These fixes were applied to address a 400 Bad Request when updating suppliers (caused by request payload handling) and failures when deleting supplier products.
