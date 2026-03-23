import React from "react";
import { Alert } from "react-native";
import { DataTableScreen, StatusBadge, formatMoney } from "../components";
import { useAuthStore } from "../store/authStore";

const GoodsReceiptListScreen = () => {
    const { role } = useAuthStore();

    return (
        <DataTableScreen
            apiUrl="/goods-receipts"
            title="Nhập hàng (GR)"
            searchPlaceholder="Tìm mã phiếu nhập..."
            hideDefaultDetailAction
            createAction={{
                label: "Thêm GR",
                onPress: () =>
                    Alert.alert(
                        "Thêm GR",
                        "Sẽ mở form tạo phiếu nhập ở bước tiếp theo.",
                    ),
            }}
            rowActions={[
                {
                    label: "Xem chi tiết",
                    onPress: (row) =>
                        Alert.alert(
                            "Chi tiết GR",
                            `Sẽ mở chi tiết ${row?.grNo || "phiếu"}.`,
                        ),
                },
                {
                    label: "Sửa",
                    tone: "neutral",
                    onPress: (row) =>
                        Alert.alert("Sửa GR", `Sửa ${row?.grNo || "phiếu"}.`),
                },
                {
                    label: "In",
                    tone: "neutral",
                    onPress: (row) =>
                        Alert.alert(
                            "In GR",
                            `Sẵn sàng in ${row?.grNo || "phiếu"}.`,
                        ),
                },
                {
                    label: "Duyệt",
                    onPress: (row) =>
                        Alert.alert("Duyệt", `Duyệt ${row?.grNo || "phiếu"}.`),
                    shouldShow: (row) =>
                        role === "ADMIN" &&
                        ["DRAFT", "PENDING"].includes(
                            String(row?.status || ""),
                        ),
                },
            ]}
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
};

export default GoodsReceiptListScreen;
