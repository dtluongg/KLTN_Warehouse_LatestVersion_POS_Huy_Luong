# Tóm tắt Các File Thay đổi / Tạo Mới cho PayOS QR Payment

## File Tạo Mới

### 1. Enum & Configuration
- `backend/src/main/java/IUH/KLTN/LvsH/enums/PaymentStatus.java` - Enum trạng thái thanh toán
- `backend/src/main/java/IUH/KLTN/LvsH/config/PayOSConfig.java` - Spring Bean configuration cho PayOS

### 2. Service Layer
- `backend/src/main/java/IUH/KLTN/LvsH/service/PaymentService.java` - Interface
- `backend/src/main/java/IUH/KLTN/LvsH/service/impl/PaymentServiceImpl.java` - Implementation

### 3. Controller
- `backend/src/main/java/IUH/KLTN/LvsH/controller/PaymentController.java` - 2 endpoints: tạo QR + webhook

### 4. DTO
- `backend/src/main/java/IUH/KLTN/LvsH/dto/payment/CreatePaymentLinkResponseDTO.java` - Response DTO

### 5. Database Migration
- `backend/src/main/resources/db/migration/V19__add_payment_fields.sql` - Thêm 2 cột vào orders

### 6. Documentation
- `PAYMENT_QR_IMPLEMENTATION.md` - Hướng dẫn triển khai chi tiết

---

## File Sửa Đổi

### 1. pom.xml
- ✅ Thêm dependency: `vn.payos:payos-java:2.0.1`

### 2. Order Entity
- `backend/src/main/java/IUH/KLTN/LvsH/entity/Order.java`
  - ✅ Import PaymentStatus enum
  - ✅ Thêm field: `paymentStatus` (enum, default PENDING_PAYMENT)
  - ✅ Thêm field: `payosOrderCode` (String, unique)

### 3. Repository
- `backend/src/main/java/IUH/KLTN/LvsH/repository/OrderRepository.java`
  - ✅ Thêm method: `Optional<Order> findByPayosOrderCode(String payosOrderCode)`

### 4. DTO
- `backend/src/main/java/IUH/KLTN/LvsH/dto/order/OrderRequestDTO.java`
  - ✅ Thêm field: `discountAmount`
  - ✅ Thêm field: `surchargeAmount`

- `backend/src/main/java/IUH/KLTN/LvsH/dto/order/OrderDetailResponseDTO.java`
  - ✅ Thêm field: `paymentStatus`
  - ✅ Thêm field: `payosOrderCode`

### 5. Service Implementation
- `backend/src/main/java/IUH/KLTN/LvsH/service/impl/OrderServiceImpl.java`
  - ✅ Cập nhật `createOrder()` để nhận và xử lý discountAmount, surchargeAmount
  - ✅ Cập nhật `getOrderDetailById()` để map paymentStatus, payosOrderCode vào DTO

### 6. Controller
- `backend/src/main/java/IUH/KLTN/LvsH/controller/OrderController.java`
  - ✅ Thêm import `java.util.Map`
  - ✅ Thêm endpoint: `GET /api/orders/{id}/payment-status`

### 7. Configuration
- `backend/src/main/resources/application.properties`
  - ✅ Thêm PayOS config:
    ```properties
    payos.client-id=${PAYOS_CLIENT_ID:}
    payos.api-key=${PAYOS_API_KEY:}
    payos.checksum-key=${PAYOS_CHECKSUM_KEY:}
    ```

---

## Các bước tiếp theo

1. **Cấu hình credentials PayOS**
   - Lấy từ [my.payos.vn](https://my.payos.vn)
   - Set environment variables hoặc cập nhật application.properties

2. **Build backend**
   ```bash
   cd backend
   mvn clean install
   ```

3. **Khởi động backend**
   ```bash
   mvn spring-boot:run
   ```

4. **Cấu hình webhook URL** ở PayOS dashboard
   - Dev: dùng ngrok expose: `ngrok http 9999`
   - Production: dùng domain thật

5. **Update Frontend POS**
   - Gọi `/api/payments/create-qr/{orderId}` sau khi tạo đơn
   - Hiển thị QR code từ response
   - Polling `/api/orders/{orderId}/payment-status` để check kết quả
   - Khi `paymentStatus == PAID`, hiển thị "Thanh toán thành công"

---

## Quick Test với Postman

### 1. Tạo Order
```
POST http://localhost:9999/api/orders
Content-Type: application/json

{
  "customerId": null,
  "warehouseId": 1,
  "salesChannel": "POS",
  "paymentMethod": "TRANSFER",
  "discountAmount": 10000,
  "surchargeAmount": 5000,
  "note": "Test QR payment",
  "items": [
    {
      "productId": 1,
      "qty": 1,
      "salePrice": 100000
    }
  ]
}
```

### 2. Tạo QR
```
POST http://localhost:9999/api/payments/create-qr/1
```

Response sẽ chứa QR code image

### 3. Check Payment Status
```
GET http://localhost:9999/api/orders/1/payment-status
```

---

## Notes Quan trọng

- ⚠️ Backend tính `netAmount = gross - discount - couponDiscount + surcharge` ở server
- ⚠️ Frontend không được phép sửa số tiền mà phải hiển thị đúng `netAmount` từ server
- ⚠️ Webhook verify signature với checksum key
- ⚠️ Mỗi order chỉ tạo QR 1 lần (check `payosOrderCode` null)
- ⚠️ PayOS có quy tắc rate limit, cần xử lý retry logic ở frontend

---

Xong! Backend implementation đã hoàn tất. Sẵn sàng để frontend integrate.
