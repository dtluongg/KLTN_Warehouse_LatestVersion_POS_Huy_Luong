import React from "react";
import { Alert } from "react-native";
import { DataTableScreen, StatusBadge } from "../components";

const StaffListScreen = () => (
    <DataTableScreen
        apiUrl="/staffs"
        title="Nhân viên"
        searchPlaceholder="Tìm mã, tên nhân viên..."
        hideDefaultDetailAction
        createAction={{
            label: "Thêm NV",
            onPress: () =>
                Alert.alert(
                    "Thêm nhân viên",
                    "Sẽ mở form thêm nhân viên ở bước tiếp theo.",
                ),
        }}
        rowActions={[
            {
                label: "Sửa",
                tone: "neutral",
                onPress: (row) =>
                    Alert.alert(
                        "Sửa nhân viên",
                        `Sẽ mở màn hình sửa cho ${row?.fullName || "nhân viên"}.`,
                    ),
            },
        ]}
        columns={[
            { key: "staffCode", label: "Mã NV", width: 100 },
            { key: "fullName", label: "Họ tên", flex: 2 },
            { key: "username", label: "Tài khoản", flex: 1 },
            { key: "phone", label: "SĐT", flex: 1 },
            { key: "email", label: "Email", flex: 1.5 },
            { key: "role", label: "Vai trò", flex: 1 },
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

export default StaffListScreen;
