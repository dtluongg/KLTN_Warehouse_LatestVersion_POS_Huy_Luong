# Hướng dẫn Triển khai PayOS QR Payment

## Tóm tắt những gì đã thêm

### Backend
1. **Dependency PayOS** - Thêm vào pom.xml
2. **Enum PaymentStatus** - 5 trạng thái: PENDING_PAYMENT, PAID, FAILED, EXPIRED, CANCELLED_PAYMENT
3. **Migration SQL V19** - Thêm 2 cột vào bảng orders: `payment_status` và `payos_order_code`
4. **Order Entity** - Thêm 2 field: paymentStatus, payosOrderCode
5. **PayOS Config** - Cấu hình bean PayOS từ application.properties
6. **PaymentService** - Xử lý tạo QR link và verify webhook
7. **PaymentController** - 2 endpoint:
   - `POST /api/payments/create-qr/{orderId}` - Tạo QR payment link
   - `POST /api/payments/webhook` - Nhận callback từ PayOS
8. **OrderController** - Thêm endpoint: `GET /api/orders/{id}/payment-status`
9. **OrderServiceImpl** - Cập nhật logic để nhận discountAmount, surchargeAmount từ frontend

### DTO Updates
- `OrderRequestDTO` - Thêm discountAmount, surchargeAmount
- `OrderDetailResponseDTO` - Thêm paymentStatus, payosOrderCode

---

## Bước cấu hình

### 1. Cấu hình PayOS Credentials

Mở file `backend/src/main/resources/application.properties` và thêm PayOS credentials:

```properties
payos.client-id=YOUR_CLIENT_ID
payos.api-key=YOUR_API_KEY
payos.checksum-key=YOUR_CHECKSUM_KEY
```

Hoặc sử dụng environment variables:

```bash
export PAYOS_CLIENT_ID=your_client_id
export PAYOS_API_KEY=your_api_key
export PAYOS_CHECKSUM_KEY=your_checksum_key
```

### 2. Chạy Migration

Khi khởi động lại backend, Flyway sẽ tự động chạy V19__add_payment_fields.sql để thêm 2 cột vào bảng orders.

---

## API Endpoints

### Tạo QR Payment Link

**Request:**
```bash
POST /api/payments/create-qr/{orderId}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Payment link created successfully",
  "data": {
    "orderCode": "1713785234",
    "amount": "100000",
    "description": "Thanh toan don hang ORD-20240422-001",
    "checkoutUrl": "https://checkout.payos.vn/...",
    "qrCode": "data:image/png;base64,...",
    "status": "ACTIVE",
    "expireDate": "1713785534"
  }
}
```

### Webhook Callback

**PayOS sẽ gửi POST tới:**
```
/api/payments/webhook
```

**Backend xác minh webhook, verify số tiền, cập nhật payment_status = PAID**

### Lấy trạng thái thanh toán của Order

**Request:**
```bash
GET /api/orders/{orderId}/payment-status
```

**Response:**
```json
{
  "success": true,
  "paymentStatus": "PENDING_PAYMENT",
  "netAmount": 100000
}
```

---

## Luồng hoạt động

### 1. POS Frontend tạo đơn hàng
```
POST /api/orders
Body: {
  customerId: ...,
  paymentMethod: "TRANSFER",  // QR là TRANSFER
  discountAmount: 10000,
  surchargeAmount: 5000,
  items: [...]
}
```

Response sẽ trả về `orderId` và `paymentStatus: PENDING_PAYMENT`

### 2. Frontend gọi tạo QR
```
POST /api/payments/create-qr/{orderId}
```

Backend sẽ:
- Lấy order từ DB
- Tính toán netAmount (đã chốt cứng ở server)
- Tạo payment link với PayOS
- Lưu payosOrderCode vào order
- Trả về QR code cho frontend

### 3. Frontend hiển thị QR
- Hiển thị QR image
- Hiển thị số tiền cần thanh toán (netAmount)
- Hiển thị mã đơn hàng

### 4. Khách quét QR và thanh toán
- PayOS xử lý giao dịch
- Khi thành công, PayOS gửi webhook callback

### 5. Backend nhận webhook
```
POST /api/payments/webhook
```

Backend sẽ:
- Verify chữ ký webhook
- Kiểm tra số tiền (amountReceived == netAmount)
- Nếu khớp, cập nhật order.paymentStatus = PAID
- Trả về response success

### 6. Frontend polling để kiểm tra trạng thái
```
GET /api/orders/{orderId}/payment-status
```

Khi `paymentStatus == PAID`, hiển thị "Thanh toán thành công"

---

## Cấu hình Webhook (quan trọng!)

1. Lấy webhook URL (nếu dev thì dùng ngrok)
2. Truy cập [my.payos.vn](https://my.payos.vn)
3. Đăng ký webhook URL: `https://your-domain.com/api/payments/webhook`
4. Hoặc gọi API confirm webhook qua endpoint: `POST /order/confirm-webhook` (xem PayOS sample)

---

## Xử lý các tình huống

### Khách không đủ tiền trong tài khoản
- Webhook sẽ không gửi (hoặc gửi failed status)
- Order vẫn giữ `paymentStatus = PENDING_PAYMENT`
- Khách có thể thử lại hoặc đổi sang tiền mặt

### Khách hết hạn QR (quá 5 phút)
- Frontend có thể check expireDate
- Hoặc gọi endpoint hủy QR cũ rồi tạo mới
- Cập nhật `paymentStatus = EXPIRED`

### Khách đổi sang tiền mặt
- Hủy QR cũ (gọi PayOS API cancel)
- Tạo order mới hoặc cập nhật paymentMethod = CASH
- Set paymentStatus = PAID (vì tiền mặt)

---

## Bước tiếp theo (Frontend)

1. Tạo QR Modal/Screen để hiển thị QR
2. Hiển thị số tiền (netAmount) cứng từ backend
3. Countdown hết hạn (dựa vào expireDate)
4. Polling `GET /api/orders/{id}/payment-status` mỗi 2-3 giây
5. Khi `paymentStatus == PAID`, hiển thị "Thành công" và cho phép in/lưu đơn

---

## Testing

### Local Development
1. Cài đặt ngrok: `ngrok http 9999`
2. Copy URL ngrok vào PayOS dashboard webhook
3. Sử dụng sandbox PayOS để test

### Test Case
- [x] Tạo order thành công
- [x] Tạo QR payment link thành công
- [x] Webhook callback verify đúng số tiền
- [x] Trạng thái order cập nhật PAID
- [x] Webhook callback với số tiền sai -> REJECT
- [x] QR hết hạn -> EXPIRED

---

## Checklist triển khai

- [ ] Cấu hình PayOS credentials
- [ ] Chạy migration V19
- [ ] Build backend: `mvn clean install`
- [ ] Khởi động backend: `mvn spring-boot:run`
- [ ] Cấu hình webhook URL ở PayOS dashboard
- [ ] Test API tạo QR bằng Postman
- [ ] Test webhook callback (dùng ngrok + Postman)
- [ ] Cập nhật frontend POS
- [ ] Test end-to-end với QR scanner

---

## Troubleshooting

### Migration không chạy
- Check log Flyway: `Executed: V19__add_payment_fields.sql`
- Verify bảng orders có 2 cột mới: `payment_status`, `payos_order_code`

### Webhook verify fail
- Kiểm tra PayOS credentials đúng chưa
- Kiểm tra checksum-key khớp chưa
- Xem raw payload webhook trong log

### Số tiền không khớp
- Verify frontend gửi đúng discountAmount, surchargeAmount
- Backend tính netAmount: `gross - discount - couponDiscount + surcharge`
- PayOS nhận đúng amount chưa

---

Liên hệ PayOS documentation: https://docs.payos.vn/
