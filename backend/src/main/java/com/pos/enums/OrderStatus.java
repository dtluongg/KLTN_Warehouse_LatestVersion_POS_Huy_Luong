package com.pos.enums;

// PENDING CONFIRMED SHIPPED chỉ dùng thêm các enum này cho phía online
public enum OrderStatus {
    DRAFT, // Đơn nháp (Đang chọn món)
    PENDING, // Chờ xử lý / Chờ thanh toán
    CONFIRMED, // Đã xác nhận (ảnh hưởng tồn kho-phía online khi khách đã thanh toán thành
               // công)
    SHIPPED, // Đang giao hàng
    COMPLETED, // Đã hoàn thành (ảnh hưởng tồn kho)
    CANCELLED, // Bị hủy
    REFUNDED // Đã hoàn tiền (Trả hàng)
}
