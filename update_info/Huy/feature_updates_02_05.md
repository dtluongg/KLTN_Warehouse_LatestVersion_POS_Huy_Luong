# Tổng Hợp Tính Năng & Chỉnh Sửa Gần Đây

Dưới đây là danh sách chi tiết toàn bộ các tính năng đã được phát triển và các lỗi đã được khắc phục trong suốt quá trình làm việc vừa qua.

## 1. Cập Nhật Màn Hình Bán Hàng (POS)
- **Giao diện thẻ sản phẩm:** Đã cố định kích thước (size) thẻ sản phẩm trên giao diện, khắc phục triệt để tình trạng thẻ bị tràn hoặc tự co giãn mất thẩm mỹ khi rớt dòng và đứng một mình.
- **Xử lý giỏ hàng:** Đã thêm cơ chế tự động xóa toàn bộ sản phẩm trong giỏ hàng (reset cart) khi thu ngân tiến hành thay đổi "Kho xuất hàng", nhằm ngăn chặn lỗi xuất sai kho.

## 2. Xuất File Excel Danh Sách Sản Phẩm
- **Đồng bộ hóa bộ lọc:** Đã sửa lỗi chức năng "Export" luôn xuất toàn bộ kho dữ liệu. Giờ đây, file Excel được tải xuống sẽ áp dụng chính xác các tiêu chí lọc (Filter) mà người dùng đang thiết lập trên giao diện (như từ khóa tìm kiếm, danh mục, trạng thái hoạt động).

## 3. Quản Lý Đơn Đặt Hàng (PO) & Phiếu Nhập Kho (GR)
- **Cấu trúc DTO & Xử lý nghiệp vụ:** Đã sửa chữa và hoàn thiện logic xử lý (bao gồm các hàm tính toán số lượng hàng chờ nhận `pendingQty`, hàng đã nhận `receivedQty`) của PO và GR. 
- **Lỗi biên dịch:** Khắc phục triệt để các lỗi Compilation Error trong `PurchaseOrderServiceImpl` để luồng làm việc của PO và GR thông suốt.
- **Loại bỏ cảnh báo:** Đã gỡ bỏ toàn bộ những đoạn code liên quan đến cảnh báo giá (price warnings) theo đúng yêu cầu.

## 4. Tính Năng In Ấn Chứng Từ Toàn Hệ Thống
- **Cập nhật Backend:** Bổ sung trường `productShortName` vào DTO và chỉnh sửa `OrderServiceImpl` để trả về tên viết tắt.
- **Xây dựng hệ thống in:**
  - Viết tiện ích in ấn chuyên dụng (`printUtils.ts`). Khắc phục lỗi `expo-print` trên Web chỉ hiển thị ảnh chụp màn hình bằng cách mở tab HTML độc lập và gọi API `window.print()` gốc của hệ điều hành.
  - Xây dựng hệ thống HTML templates (`printTemplates.ts`) với thiết kế đồng bộ cho 5 loại chứng từ:
    - **Hóa đơn Bán hàng (Order):** Có ưu tiên hiển thị Tên viết tắt (Short Name).
    - **Đơn đặt hàng (Purchase Order)**
    - **Phiếu nhập kho (Goods Receipt)**
    - **Phiếu trả hàng khách hàng (Customer Return)**
    - **Phiếu kiểm/điều chỉnh kho (Stock Adjustment)**
  - Tích hợp gọi API để lấy dữ liệu chi tiết, gắn tính năng vào nút **"In"** ở tất cả các trang danh sách.

## 5. Tối Ưu Hóa Thanh Tìm Kiếm (Search Bar)
- **Vấn đề:** Thanh tìm kiếm đã có sẵn giao diện nhưng không tự động kích hoạt lọc danh sách khi người dùng gõ từ khóa.
- **Giải pháp:** Bổ sung logic **Debounce Search** (Đợi 0.5 giây sau khi ngừng gõ) vào component dùng chung `DataTableScreen.tsx`.
- **Hiệu quả:**
  - Thanh tìm kiếm tự động gọi API và hoạt động mượt mà trên **tất cả các màn hình danh sách**.
  - **Trang Sản Phẩm:** Hỗ trợ quét và tìm theo **Mã vạch (Barcode)**, SKU, Tên sản phẩm.
  - **Trang Chứng từ:** Tìm nhanh theo Mã phiếu (`grNo`, `poNo`, `orderNo`), tên Khách hàng, tên Nhà cung cấp,...

## 6. Rà Soát Hệ Thống Lưu Dấu Vết (Created By)
- **Kết quả rà soát Backend:**
  - Đã rà soát toàn bộ hệ thống (các file tầng Service).
  - Khẳng định 100% hệ thống không gán cứng (hardcode) giá trị ID `1` cho người tạo phiếu.
  - Thông tin `createdBy` luôn được lấy linh động và bảo mật từ đối tượng `Staff` của tài khoản đang đăng nhập hiện tại (`SecurityContextHolder`), đảm bảo tính minh bạch khi truy vết dữ liệu.
