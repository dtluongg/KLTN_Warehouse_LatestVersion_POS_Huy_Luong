import React from "react";
import DataTableScreen, {
    StatusBadge,
    formatMoney,
} from "../components/DataTableScreen";

const GoodsReceiptListScreen = () => (
    <DataTableScreen
        apiUrl="/goods-receipts"
        searchPlaceholder="Tìm mã phiếu nhập..."
        columns={[
            { key: "grNo", label: "Mã GR", width: 130 },
            { key: "purchaseOrder.poNo", label: "Tham chiếu PO", flex: 1 },
            { key: "supplier.name", label: "Nhà cung cấp", flex: 1.5 },
            { key: "warehouse.name", label: "Kho", flex: 1 },
            { key: "receiptDate", label: "Ngày nhập", flex: 1 },
            {
                key: "totalAmount",
                label: "Tiền hàng",
                flex: 1,
                render: (v: any) => <>{formatMoney(v)}</>,
            },
            {
                key: "totalVat",
                label: "VAT",
                flex: 1,
                render: (v: any) => <>{formatMoney(v)}</>,
            },
            {
                key: "status",
                label: "Trạng thái",
                width: 110,
                render: (v: any) => <StatusBadge status={v || "—"} />,
            },
            {
                key: "totalAmountPayable",
                label: "Tổng tiền",
                flex: 1,
                render: (v: any) => <>{formatMoney(v)}</>,
            },
            { key: "createdBy.fullName", label: "Người tạo", flex: 1 },
            { key: "note", label: "Ghi chú", flex: 1.5 },
        ]}
    />
);

export default GoodsReceiptListScreen;
