import React from "react";
import DataTableScreen, {
    StatusBadge,
    formatMoney,
} from "../components/DataTableScreen";

const CustomerReturnListScreen = () => (
    <DataTableScreen
        apiUrl="/customer-returns"
        searchPlaceholder="Tìm mã phiếu trả hàng KH..."
        columns={[
            { key: "returnNo", label: "Mã phiếu", width: 130 },
            { key: "order.orderNo", label: "Tham chiếu đơn", flex: 1 },
            { key: "customer.name", label: "Khách hàng", flex: 1.5 },
            { key: "warehouse.name", label: "Kho", flex: 1 },
            { key: "returnDate", label: "Ngày trả", flex: 1 },
            {
                key: "status",
                label: "Trạng thái",
                width: 110,
                render: (v: any) => <StatusBadge status={v || "—"} />,
            },
            {
                key: "totalRefund",
                label: "Tổng hoàn",
                flex: 1,
                render: (v: any) => <>{formatMoney(v)}</>,
            },
            { key: "createdBy.fullName", label: "Người tạo", flex: 1 },
            { key: "note", label: "Ghi chú", flex: 1.5 },
        ]}
    />
);

export default CustomerReturnListScreen;
