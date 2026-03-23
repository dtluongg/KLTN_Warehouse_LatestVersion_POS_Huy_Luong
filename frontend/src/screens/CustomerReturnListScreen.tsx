import React from "react";
import { Alert } from "react-native";
import { DataTableScreen, StatusBadge, formatMoney } from "../components";
import { useAuthStore } from "../store/authStore";

const CustomerReturnListScreen = () => {
    const { role } = useAuthStore();

    return (
        <DataTableScreen
            apiUrl="/customer-returns"
            title="Trả hàng KH"
            searchPlaceholder="Tìm mã phiếu trả hàng KH..."
            hideDefaultDetailAction
            createAction={{
                label: "Thêm phiếu trả KH",
                onPress: () =>
                    Alert.alert(
                        "Thêm phiếu trả KH",
                        "Sẽ mở form tạo phiếu trả hàng KH ở bước tiếp theo.",
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
                            "In phiếu trả KH",
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
};

export default CustomerReturnListScreen;
