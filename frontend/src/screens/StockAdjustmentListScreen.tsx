import React from "react";
import DataTableScreen, { StatusBadge } from "../components/DataTableScreen";

const StockAdjustmentListScreen = () => (
    <DataTableScreen
        apiUrl="/stock-adjustments"
        searchPlaceholder="Tìm mã phiếu kiểm kho..."
        columns={[
            { key: "adjustNo", label: "Mã phiếu", width: 130 },
            { key: "warehouse.name", label: "Kho", flex: 1 },
            { key: "adjustDate", label: "Ngày kiểm", flex: 1 },
            {
                key: "status",
                label: "Trạng thái",
                width: 110,
                render: (v: any) => <StatusBadge status={v || "—"} />,
            },
            { key: "reason", label: "Lý do", flex: 1.5 },
            { key: "createdBy.fullName", label: "Người tạo", flex: 1 },
            { key: "note", label: "Ghi chú", flex: 1.5 },
        ]}
    />
);

export default StockAdjustmentListScreen;
