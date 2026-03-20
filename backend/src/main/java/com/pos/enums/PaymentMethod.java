package com.pos.enums;

public enum PaymentMethod {
    CASH,       // Tiền mặt
    TRANSFER,   // Chuyển khoản
    MIX,        // Kết hợp (Tiền mặt + Chuyển khoản/Cà thẻ)
    DEBT,       // Ghi nợ (Mua thiếu)
    CARD        // Quẹt thẻ (Thẻ tín dụng/ATM)
}
