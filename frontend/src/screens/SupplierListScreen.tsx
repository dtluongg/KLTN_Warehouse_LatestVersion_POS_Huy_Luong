import React from "react";
import { Alert } from "react-native";
import { DataTableScreen, StatusBadge } from "../components";

const SupplierListScreen = () => (
    <DataTableScreen
        apiUrl="/suppliers"
        title="Nhà cung cấp"
        searchPlaceholder="Tìm mã, tên nhà cung cấp..."
        hideDefaultDetailAction
        createAction={{
            label: "Thêm NCC",
            onPress: () =>
                Alert.alert(
                    "Thêm nhà cung cấp",
                    "Sẽ mở form thêm nhà cung cấp ở bước tiếp theo.",
                ),
        }}
        rowActions={[
            {
                label: "Sửa",
                tone: "neutral",
                onPress: (row) =>
                    Alert.alert(
                        "Sửa nhà cung cấp",
                        `Sẽ mở màn hình sửa cho ${row?.name || "nhà cung cấp"}.`,
                    ),
            },
        ]}
        columns={[
            { key: "supplierCode", label: "Mã NCC", width: 100 },
            { key: "name", label: "Tên nhà cung cấp", flex: 2 },
            { key: "phone", label: "SĐT", flex: 1 },
            { key: "taxCode", label: "MST", flex: 1 },
            { key: "address", label: "Địa chỉ", flex: 1.5 },
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

export default SupplierListScreen;
