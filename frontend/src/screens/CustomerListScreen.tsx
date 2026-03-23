import React from "react";
import { Alert } from "react-native";
import { DataTableScreen, StatusBadge } from "../components";

const CustomerListScreen = () => (
    <DataTableScreen
        apiUrl="/customers"
        title="Khách hàng"
        searchPlaceholder="Tìm mã, tên, SĐT khách hàng..."
        hideDefaultDetailAction
        createAction={{
            label: "Thêm KH",
            onPress: () =>
                Alert.alert(
                    "Thêm khách hàng",
                    "Sẽ mở form thêm khách hàng ở bước tiếp theo.",
                ),
        }}
        rowActions={[
            {
                label: "Sửa",
                tone: "neutral",
                showOnDesktop: true,
                showOnMobile: true,
                onPress: (row) =>
                    Alert.alert(
                        "Sửa khách hàng",
                        `Sẽ mở màn hình sửa cho ${row?.name || "khách hàng"}.`,
                    ),
            },
        ]}
        columns={[
            { key: "customerCode", label: "Mã KH", width: 100 },
            { key: "name", label: "Tên khách hàng", flex: 2 },
            { key: "phone", label: "Số điện thoại", flex: 1 },
            { key: "email", label: "Email", flex: 1 },
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

export default CustomerListScreen;
