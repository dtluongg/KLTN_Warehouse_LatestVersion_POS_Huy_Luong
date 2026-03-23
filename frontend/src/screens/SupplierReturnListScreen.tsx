import React from "react";
import { Alert } from "react-native";
import { DataTableScreen, StatusBadge, formatMoney } from "../components";
import { useAuthStore } from "../store/authStore";

const SupplierReturnListScreen = () => {
    const { role } = useAuthStore();

    return (
        <DataTableScreen
            apiUrl="/supplier-returns"
            title="Trả hàng NCC"
            searchPlaceholder="Tìm mã phiếu trả hàng NCC..."
            hideDefaultDetailAction
            createAction={{
                label: "Thêm phiếu trả NCC",
                onPress: () =>
                    Alert.alert(
                        "Thêm phiếu trả NCC",
                        "Sẽ mở form tạo phiếu trả hàng NCC ở bước tiếp theo.",
                    ),
            }}
            rowActions={[
                {
                    label: "Xem chi tiết",
                    onPress: (row) =>
                        Alert.alert(
                            "Chi tiết trả hàng",
                            `Sẽ mở chi tiết ${row?.returnNo || "phiếu"}.`,
                        ),
                },
                {
                    label: "Sửa",
                    tone: "neutral",
                    onPress: (row) =>
                        Alert.alert(
                            "Sửa trả hàng",
                            `Sửa ${row?.returnNo || "phiếu"}.`,
                        ),
                },
                {
                    label: "In",
                    tone: "neutral",
                    onPress: (row) =>
                        Alert.alert(
                            "In phiếu trả NCC",
                            `Sẵn sàng in ${row?.returnNo || "phiếu"}.`,
                        ),
                },
                {
                    label: "Duyệt",
                    onPress: (row) =>
                        Alert.alert(
                            "Duyệt",
                            `Duyệt ${row?.returnNo || "phiếu"}.`,
                        ),
                    shouldShow: (row) =>
                        role === "ADMIN" &&
                        ["DRAFT", "PENDING"].includes(
                            String(row?.status || ""),
                        ),
                },
            ]}
            columns={[
                { key: "returnNo", label: "Mã phiếu", width: 130 },
                { key: "goodsReceipt.grNo", label: "Tham chiếu GR", flex: 1 },
                { key: "supplier.name", label: "Nhà cung cấp", flex: 1.5 },
                { key: "warehouse.name", label: "Kho", flex: 1 },
                { key: "returnDate", label: "Ngày trả", flex: 1 },
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

export default SupplierReturnListScreen;
