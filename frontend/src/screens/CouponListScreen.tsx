import React from "react";
import DataTableScreen, {
    StatusBadge,
    formatMoney,
} from "../components/DataTableScreen";

const CouponListScreen = () => (
    <DataTableScreen
        apiUrl="/coupons"
        searchPlaceholder="Tìm mã giảm giá..."
        columns={[
            { key: "code", label: "Mã coupon", width: 130 },
            { key: "discountType", label: "Loại", width: 90 },
            {
                key: "discountValue",
                label: "Giá trị",
                flex: 1,
                render: (v: any, row: any) => (
                    <>
                        {row.discountType === "PERCENT"
                            ? `${v}%`
                            : formatMoney(v)}
                    </>
                ),
            },
            {
                key: "minOrderAmount",
                label: "Đơn tối thiểu",
                flex: 1,
                render: (v: any) => <>{formatMoney(v)}</>,
            },
            {
                key: "maxDiscountAmount",
                label: "Giảm tối đa",
                flex: 1,
                render: (v: any) => <>{formatMoney(v)}</>,
            },
            {
                key: "startsAt",
                label: "Bắt đầu",
                flex: 1,
                render: (v: any) => (
                    <>{v ? new Date(v).toLocaleDateString("vi-VN") : "—"}</>
                ),
            },
            {
                key: "endsAt",
                label: "Kết thúc",
                flex: 1,
                render: (v: any) => (
                    <>{v ? new Date(v).toLocaleDateString("vi-VN") : "—"}</>
                ),
            },
            { key: "usageLimit", label: "Giới hạn", width: 80 },
            { key: "usedCount", label: "Đã dùng", width: 80 },
            {
                key: "isActive",
                label: "Trạng thái",
                width: 100,
                render: (v: any) => (
                    <StatusBadge status={v ? "ACTIVE" : "INACTIVE"} />
                ),
            },
        ]}
    />
);

export default CouponListScreen;
