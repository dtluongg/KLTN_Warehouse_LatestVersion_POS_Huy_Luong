package com.pos.enums;

public enum DocumentStatus {
    DRAFT,      // Bản nháp / Chờ duyệt / Chờ xử lý, chưa ảnh hưởng tồn kho hay công nợ
    POSTED,     // Đã chốt (Ghi nhận chính thức vào hệ thống: trừ kho, cộng nợ...)
    CANCELLED   // Đã hủy bỏ, không có giá trị
}
