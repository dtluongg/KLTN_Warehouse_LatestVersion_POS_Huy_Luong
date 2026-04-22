# Hướng dẫn API Thống kê Kho Lương (Warehouse Statistics API)

## Tổng quan
6 API mới được thêm vào `/api/reports` endpoint để hỗ trợ thống kê quản lý kho. Mỗi endpoint trả về JSON list với các KPI khác nhau.

## 1. Giá trị tồn kho (Inventory Value)
**GET** `/api/reports/inventory-value?warehouseId={id}`

### Mục đích
Tính giá trị tồn kho hiện tại theo kho, sắp xếp giảm dần theo giá trị.

### Tham số
- `warehouseId` (required): ID kho

### Phản hồi
```json
[
  {
    "warehouseId": 1,
    "warehouseName": "Kho Chính",
    "productId": 5,
    "sku": "SKU001",
    "productName": "Sản phẩm A",
    "onHand": 100,
    "avgCost": 50.00,
    "totalValue": 5000.00,
    "category": "Điện tử"
  }
]
```

### Ý nghĩa
- Giúp xác định tài sản trong kho
- Phát hiện sản phẩm có vốn gấp (giá trị cao nhưng chậm bán)

---

## 2. Số ngày đủ hàng (Days of Coverage)
**GET** `/api/reports/days-of-coverage?warehouseId={id}&analysisDays={days}`

### Mục đích
Tính dự kiến còn bán được bao nhiêu ngày dựa trên nhu cầu trung bình.

### Tham số
- `warehouseId` (required): ID kho
- `analysisDays` (optional, default: 30): Kỳ phân tích tính nhu cầu trung bình (số ngày)

### Phản hồi
```json
[
  {
    "warehouseId": 1,
    "warehouseName": "Kho Chính",
    "productId": 5,
    "sku": "SKU001",
    "productName": "Sản phẩm A",
    "onHand": 100,
    "avgDailyDemand": 10.50,
    "daysOfCoverage": 9,
    "riskLevel": "WARNING"
  }
]
```

### Cách giải thích
- **daysOfCoverage = onHand / avgDailyDemand**
- **riskLevel**:
  - CRITICAL: < 3 ngày (sắp hết, cần nhập gấp)
  - WARNING: 3-7 ngày (dưới mức an toàn)
  - SAFE: > 7 ngày (bình thường)

---

## 3. Cảnh báo thiếu hàng (Stockout Risk)
**GET** `/api/reports/stockout-risk?warehouseId={id}&analysisDays={days}`

### Mục đích
Cảnh báo các sản phẩm sắp hết hàng, ước tính ngày hết.

### Tham số
- `warehouseId` (required): ID kho
- `analysisDays` (optional, default: 30): Kỳ phân tích

### Phản hồi
```json
[
  {
    "warehouseId": 1,
    "warehouseName": "Kho Chính",
    "productId": 5,
    "sku": "SKU001",
    "productName": "Sản phẩm A",
    "onHand": 15,
    "avgDailyDemand": 8.5,
    "daysUntilStockout": 1,
    "estimatedStockoutDate": "2026-04-24",
    "priority": "CRITICAL"
  }
]
```

### Priority levels
- **CRITICAL**: < 2 ngày (nguy hiểm, mất cơ hội bán)
- **HIGH**: 2-5 ngày
- **MEDIUM**: 5-14 ngày
- **SAFE**: > 14 ngày

---

## 4. Hàng chậm luân chuyển (Slow Moving Products)
**GET** `/api/reports/slow-moving-products?warehouseId={id}&inactiveDays={days}`

### Mục đích
Phát hiện sản phẩm không bán được trong X ngày (vốn chết, cần clearance).

### Tham số
- `warehouseId` (required): ID kho
- `inactiveDays` (optional, default: 30): Số ngày không phát sinh xuất

### Phản hồi
```json
[
  {
    "warehouseId": 1,
    "warehouseName": "Kho Chính",
    "productId": 10,
    "sku": "SKU010",
    "productName": "Sản phẩm B",
    "onHand": 50,
    "inventoryValue": 2500.00,
    "daysSinceLastMovement": 92,
    "lastMovementDate": "2026-01-20",
    "riskCategory": "DEAD_STOCK"
  }
]
```

### Risk Category
- **DEAD_STOCK**: > 90 ngày (nên xem xét hủy/giảm giá)
- **SLOW_MOVING**: 30-90 ngày (cần khuyến mãi)
- **NORMAL**: < 30 ngày (bình thường)

---

## 5. Chi tiết tồn kho (Current Inventory Detail)
**GET** `/api/reports/inventory-detail?warehouseId={id}`

### Mục đích
Xem toàn bộ tồn kho chi tiết theo trạng thái (hết, thiếu, bình thường).

### Tham số
- `warehouseId` (required): ID kho

### Phản hồi
```json
[
  {
    "warehouseId": 1,
    "productId": 5,
    "sku": "SKU001",
    "productName": "Sản phẩm A",
    "categoryName": "Điện tử",
    "onHand": 100,
    "avgCost": 50.00,
    "salePrice": 75.00,
    "totalValue": 5000.00,
    "status": "IN_STOCK"
  }
]
```

### Status
- **OUT_OF_STOCK**: onHand = 0
- **LOW_STOCK**: onHand < 10
- **IN_STOCK**: onHand >= 10

---

## 6. Luân chuyển tồn kho (Inventory Turnover)
**GET** `/api/reports/inventory-turnover?warehouseId={id}&fromDate={ngày}&toDate={ngày}`

### Mục đích
Phân tích tốc độ luân chuyển hàng hóa (bán nhanh hay chậm).

### Tham số
- `warehouseId` (required): ID kho
- `fromDate` (required): Ngày bắt đầu (format: YYYY-MM-DD)
- `toDate` (required): Ngày kết thúc (format: YYYY-MM-DD)

### Phản hồi
```json
[
  {
    "warehouseId": 1,
    "productId": 5,
    "sku": "SKU001",
    "productName": "Sản phẩm A",
    "quantitySold": 300,
    "revenue": 22500.00,
    "cogs": 15000.00,
    "avgInventoryQty": 150,
    "avgInventoryValue": 7500.00,
    "turnoverRatio": 2.00,
    "daysInventoryOutstanding": 182.50
  }
]
```

### Công thức
- **turnoverRatio = COGS / avgInventoryValue** (số lần luân chuyển trong kỳ)
- **daysInventoryOutstanding = 365 / turnoverRatio** (số ngày trung bình hàng nằm kho)

---

## Ví dụ gọi API từ Postman/Frontend

### Ví dụ 1: Xem giá trị tồn kho kho ID=1
```
GET /api/reports/inventory-value?warehouseId=1
Authorization: Bearer <jwt_token>
```

### Ví dụ 2: Xem cảnh báo hết hàng trong 30 ngày gần đây
```
GET /api/reports/stockout-risk?warehouseId=1&analysisDays=30
Authorization: Bearer <jwt_token>
```

### Ví dụ 3: Xem hàng chậm luân chuyển (chưa bán trong 60 ngày)
```
GET /api/reports/slow-moving-products?warehouseId=1&inactiveDays=60
Authorization: Bearer <jwt_token>
```

### Ví dụ 4: Phân tích luân chuyển từ 01/04 đến 22/04/2026
```
GET /api/reports/inventory-turnover?warehouseId=1&fromDate=2026-04-01&toDate=2026-04-22
Authorization: Bearer <jwt_token>
```

---

## Phân quyền
- **Endpoint**: Toàn bộ 6 API yêu cầu role `ADMIN` hoặc `WAREHOUSE_STAFF`

---

## Ghi chú cho lập trình viên

### Hiệu suất
- Các API này duyệt toàn bộ sản phẩm trong kho, nên có thể chậm nếu có hàng ngàn SKU.
- Khuyến nghị: Thêm cache hoặc pagination nếu dữ liệu lớn.

### Tính toán nhu cầu trung bình
- Chỉ tính từ các đơn hàng có status = `POSTED`
- Công thức: `avgDailyDemand = totalQtySold / analysisDays`

### Trường hợp đặc biệt
- Nếu sản phẩm chưa bán lần nào, `lastMovementDate` = ngày tạo sản phẩm
- Nếu nhu cầu = 0, `daysOfCoverage` = 999 (được coi là "vô tận")

---

## Sử dụng trong nghiệp vụ thực tế

### Cho nhân viên kho
1. Mỗi sáng kiểm tra **Stockout Risk** để biết sản phẩm nào cần nhập gấp
2. Hàng tuần xem **Slow Moving Products** để xem xét promotional

### Cho quản lý
1. Hàng tháng kiểm tra **Inventory Value** để quản lý vốn kho
2. Phân tích **Inventory Turnover** để tính KPI bán hàng

---

Hết.
