import React from "react";
import DataTableScreen, {
    StatusBadge,
    formatMoney,
} from "../components/DataTableScreen";

const OrderListScreen = () => (
    <DataTableScreen
        apiUrl="/orders"
        searchPlaceholder="Tìm mã đơn hàng..."
        columns={[
            { key: "orderNo", label: "Mã đơn", width: 130 },
            { key: "salesChannel", label: "Kênh", width: 80 },
            { key: "customer.name", label: "Khách hàng", flex: 1 },
            { key: "warehouse.name", label: "Kho", flex: 1 },
            {
                key: "orderTime",
                label: "Ngày",
                flex: 1,
                render: (v: any) => (
                    <>{v ? new Date(v).toLocaleDateString("vi-VN") : "—"}</>
                ),
            },
            {
                key: "grossAmount",
                label: "Tiền hàng",
                flex: 1,
                render: (v: any) => <>{formatMoney(v)}</>,
            },
            {
                key: "discountAmount",
                label: "CK thường",
                flex: 1,
                render: (v: any) => <>{formatMoney(v)}</>,
            },
            {
                key: "couponDiscountAmount",
                label: "CK coupon",
                flex: 1,
                render: (v: any) => <>{formatMoney(v)}</>,
            },
            {
                key: "surchargeAmount",
                label: "Phụ phí",
                flex: 1,
                render: (v: any) => <>{formatMoney(v)}</>,
            },
            {
                key: "status",
                label: "Trạng thái",
                width: 110,
                render: (v: any) => <StatusBadge status={v || "—"} />,
            },
            { key: "paymentMethod", label: "Thanh toán", width: 100 },
            {
                key: "netAmount",
                label: "Tổng tiền",
                flex: 1,
                render: (v: any) => <>{formatMoney(v)}</>,
            },
            { key: "createdBy.fullName", label: "Nhân viên", flex: 1 },
            { key: "note", label: "Ghi chú", flex: 1.5 },
        ]}
    />
);

export default OrderListScreen;
