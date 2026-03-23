import React from "react";
import { Alert } from "react-native";
import { DataTableScreen, StatusBadge } from "../components";

const WarehouseListScreen = () => (
    <DataTableScreen
        apiUrl="/warehouses"
        title="Kho hàng"
        searchPlaceholder="Tìm mã, tên kho..."
        hideDefaultDetailAction
        createAction={{
            label: "Thêm kho",
            onPress: () =>
                Alert.alert(
                    "Thêm kho",
                    "Sẽ mở form thêm kho ở bước tiếp theo.",
                ),
        }}
        rowActions={[
            {
                label: "Sửa",
                tone: "neutral",
                onPress: (row) =>
                    Alert.alert(
                        "Sửa kho",
                        `Sẽ mở màn hình sửa cho ${row?.name || "kho"}.`,
                    ),
            },
        ]}
        columns={[
            { key: "code", label: "Mã kho", width: 120 },
            { key: "name", label: "Tên kho", flex: 2 },
            { key: "address", label: "Địa chỉ", flex: 2 },
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

export default WarehouseListScreen;
