# Update Info: Big Update PO & GR

## Mục tiêu

Big update này tập trung vào luồng Purchase Order (PO) và Goods Receipt (GR) theo hướng partial receipt chuẩn, đồng thời nối lại toàn bộ flow từ schema, backend đến frontend để nghiệp vụ chạy end-to-end.

## Những gì đã làm

### 1) Nâng schema an toàn bằng migration mới

- Không sửa migration cũ, mà thêm migration kế tiếp `V17__purchase_order_partial_receipt.sql`.
- Thêm các cột mới cho `purchase_orders`:
  - `receipt_progress`
  - `closed_at`
  - `closed_reason`
  - `allow_over_receipt`
- Ràng buộc `goods_receipt_items.po_item_id` không được null.
- Thêm index cho `goods_receipts.po_id` và `goods_receipt_items.po_item_id`.
- Backfill dữ liệu cũ để xác định trạng thái nhận hàng ban đầu của PO.

### 2) Thêm enum và dữ liệu trạng thái PO

- Thêm enum `PurchaseOrderReceiptProgress`:
  - `NOT_RECEIVED`
  - `PARTIALLY_RECEIVED`
  - `FULLY_RECEIVED`
- Thêm enum `PurchaseOrderClosedReason`:
  - `FULLY_RECEIVED`
  - `PARTIALLY_RECEIVED_ACCEPTED`
  - `SUPPLIER_UNABLE_TO_DELIVER`
  - `MANUAL_CLOSE`

### 3) Cập nhật entity và DTO

- `PurchaseOrder` có thêm:
  - `receiptProgress`
  - `closedAt`
  - `closedReason`
  - `allowOverReceipt`
- DTO danh sách và chi tiết PO trả thêm:
  - tiến độ nhận hàng
  - ngày đóng PO
  - lý do đóng
  - cờ cho phép nhận vượt
  - số lượng đã nhận / còn lại cho từng item
- DTO GR thêm `poItemId` trong detail item để map đúng ngược lại PO item.

### 4) Cập nhật repository để tính số lượng đã nhận

- Thêm query tổng hợp số lượng nhận theo PO item.
- Có query loại trừ một GR cụ thể khi cập nhật phiếu draft.
- Dùng dữ liệu posted receipts để tính lại tiến độ PO và số lượng còn lại.

### 5) Cập nhật service PO

- Khi tạo PO:
  - default `receiptProgress = NOT_RECEIVED`
  - `allowOverReceipt` lấy từ request
- Khi sửa PO draft:
  - reset `receiptProgress`, `closedAt`, `closedReason`
- Khi đổi trạng thái:
  - không cho chuyển trạng thái sai logic
  - nếu hủy thì reset các field đóng/nhận hàng
- Thêm API đóng PO thủ công:
  - chỉ cho PO `POSTED`
  - chỉ cho phép lý do đóng hợp lệ
  - không cho đóng lại nếu đã có `closedAt`
- Chi tiết PO trả thêm số lượng đã nhận và còn lại theo từng item.

### 6) Cập nhật service GR

- Chỉ cho tạo / cập nhật GR từ PO còn hợp lệ.
- Validate từng item GR theo item của PO.
- Không cho nhận vượt nếu PO không bật `allowOverReceipt`.
- Khi complete GR:
  - cập nhật tồn kho
  - cập nhật giá bình quân sản phẩm
  - ghi inventory movement
  - sync lại tiến độ nhận của PO
- GR item detail trả về `poItemId` để UI map ngược lại.

### 7) Cập nhật frontend PO

- Màn danh sách PO có:
  - nút Duyệt
  - nút Hủy
  - nút Đóng PO
- Thêm refresh tự động khi quay lại màn list từ form.
- Thêm xử lý confirm tương thích web để nút action không bị treo trên browser.
- Thêm thông báo lỗi rõ khi API fail.

### 8) Cập nhật frontend GR

- Màn danh sách GR có:
  - nút Duyệt
  - nút Hủy
- Tương thích web cho các action confirm.
- Form GR:
  - chọn PO rồi tự load danh sách item còn lại
  - tự set `supplierId` và `warehouseId` từ PO detail
  - luôn hiển thị kho nhận hàng để người dùng thấy và chỉnh nếu cần
  - chỉ cho submit khi còn item hợp lệ
- Màn list tự refresh khi quay lại từ form nhờ cơ chế focus refresh ở `DataTableScreen`.

## Quy tắc nghiệp vụ chính

### PO

- PO draft có thể sửa.
- PO posted mới được nhận hàng.
- PO đã đóng hoặc đóng hoàn toàn thì không nhận thêm.
- `receiptProgress` phản ánh trạng thái nhận hàng:
  - chưa nhận
  - nhận một phần
  - nhận đủ
- Nếu PO nhận đủ thì tự đánh dấu `FULLY_RECEIVED` và có thể tự set `closedAt` / `closedReason`.
- Nếu không cho nhận vượt, tổng số lượng GR posted không được lớn hơn số lượng đặt.

### GR

- GR phải gắn với một PO hợp lệ (GR chỉ được tạo từ một PO đang ở trạng thái POSTED, chưa đóng, và còn số lượng nhận hợp lệ; các dòng GR phải khớp với các dòng của PO cha).
- GR bắt buộc có:
  - `poId`
  - `supplierId`
  - `warehouseId`
  - ít nhất 1 item
- Mỗi GR item phải map đúng với PO item của PO cha.
- Không được nhập vượt số lượng còn lại nếu PO không bật `allowOverReceipt`.
- Chỉ GR draft mới sửa được.
- GR posted không được hủy.

### Hiển thị UI

- PO/GR action trên web phải chạy được, không treo confirm.
- Sau khi tạo / duyệt / hủy / đóng, danh sách phải tự refresh khi quay lại màn.
- Trường giá trị đã chọn trên GR phải hiển thị rõ, không bị nhìn như placeholder.

## Kết quả thực tế sau update

- Tạo PO hoạt động bình thường.
- Duyệt / Hủy / Đóng PO hoạt động qua UI mới.
- GR có thể tạo theo PO còn đủ điều kiện.
- List PO/GR tự reload sau khi quay lại từ form hoặc action.
- Partial receipt và theo dõi tiến độ nhận hàng đã chạy end-to-end.

## Ghi chú

- Các thay đổi được giữ theo hướng an toàn: không sửa lịch sử migration cũ, chỉ thêm migration mới.
- Các rule backend vẫn là nguồn kiểm soát chính, frontend chỉ hỗ trợ đúng luồng và hiển thị rõ lỗi.
