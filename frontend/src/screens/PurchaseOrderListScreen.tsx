import React from "react";
import { Alert } from "react-native";
import { DataTableScreen, StatusBadge, formatMoney } from "../components";
import { useAuthStore } from "../store/authStore";

const PurchaseOrderListScreen = () => {
    const { role } = useAuthStore();

    return (
        <DataTableScreen
            apiUrl="/purchase-orders"
            title="Đặt hàng NCC"
            searchPlaceholder="Tìm mã PO, nhà cung cấp..."
            hideDefaultDetailAction
            createAction={{
                label: "Thêm PO",
                onPress: () =>
                    Alert.alert(
                        "Thêm PO",
                        "Sẽ mở form tạo đơn đặt hàng ở bước tiếp theo.",
                    ),
            }}
            rowActions={[
                {
                    label: "Xem chi tiết",
                    onPress: (row) =>
                        Alert.alert(
                            "Chi tiết PO",
                            `Sẽ mở chi tiết ${row?.poNo || "phiếu"}.`,
                        ),
                },
                {
                    label: "Sửa",
                    tone: "neutral",
                    onPress: (row) =>
                        Alert.alert("Sửa PO", `Sửa ${row?.poNo || "phiếu"}.`),
                },
                {
                    label: "In",
                    tone: "neutral",
                    onPress: (row) =>
                        Alert.alert(
                            "In PO",
                            `Sẵn sàng in ${row?.poNo || "phiếu"}.`,
                        ),
                },
                {
                    label: "Duyệt",
                    onPress: (row) =>
                        Alert.alert("Duyệt", `Duyệt ${row?.poNo || "phiếu"}.`),
                    shouldShow: (row) =>
                        role === "ADMIN" &&
                        ["DRAFT", "PENDING"].includes(
                            String(row?.status || ""),
                        ),
                },
            ]}
            columns={[
                { key: "poNo", label: "Mã PO", width: 130 },
                { key: "supplier.name", label: "Nhà cung cấp", flex: 1.5 },
                { key: "warehouse.name", label: "Kho", flex: 1 },
                { key: "orderDate", label: "Ngày đặt", flex: 1 },
                { key: "expectedDate", label: "Ngày dự kiến", flex: 1 },
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

export default PurchaseOrderListScreen;
