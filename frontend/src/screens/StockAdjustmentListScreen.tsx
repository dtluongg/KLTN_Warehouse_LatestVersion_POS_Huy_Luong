import React from "react";
import { Alert } from "react-native";
import { DataTableScreen, StatusBadge } from "../components";
import { useAuthStore } from "../store/authStore";

const StockAdjustmentListScreen = () => {
    const { role } = useAuthStore();

    return (
        <DataTableScreen
            apiUrl="/stock-adjustments"
            title="Kiểm kho / Điều chỉnh"
            searchPlaceholder="Tìm mã phiếu kiểm kho..."
            hideDefaultDetailAction
            createAction={{
                label: "Thêm phiếu kiểm",
                onPress: () =>
                    Alert.alert(
                        "Thêm phiếu kiểm",
                        "Sẽ mở form tạo phiếu kiểm kho ở bước tiếp theo.",
                    ),
            }}
            rowActions={[
                {
                    label: "Xem chi tiết",
                    onPress: (row) =>
                        Alert.alert(
                            "Chi tiết kiểm kho",
                            `Sẽ mở chi tiết ${row?.adjustNo || "phiếu"}.`,
                        ),
                },
                {
                    label: "Sửa",
                    tone: "neutral",
                    onPress: (row) =>
                        Alert.alert(
                            "Sửa kiểm kho",
                            `Sửa ${row?.adjustNo || "phiếu"}.`,
                        ),
                },
                {
                    label: "In",
                    tone: "neutral",
                    onPress: (row) =>
                        Alert.alert(
                            "In phiếu kiểm",
                            `Sẵn sàng in ${row?.adjustNo || "phiếu"}.`,
                        ),
                },
                {
                    label: "Duyệt",
                    onPress: (row) =>
                        Alert.alert(
                            "Duyệt",
                            `Duyệt ${row?.adjustNo || "phiếu"}.`,
                        ),
                    shouldShow: (row) =>
                        role === "ADMIN" &&
                        ["DRAFT", "PENDING"].includes(
                            String(row?.status || ""),
                        ),
                },
            ]}
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
};

export default StockAdjustmentListScreen;
