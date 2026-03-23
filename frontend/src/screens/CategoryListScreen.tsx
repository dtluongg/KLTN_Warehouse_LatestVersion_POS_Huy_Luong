import React from "react";
import { Alert } from "react-native";
import { DataTableScreen, StatusBadge } from "../components";

const CategoryListScreen = () => (
    <DataTableScreen
        apiUrl="/categories"
        title="Danh mục sản phẩm"
        searchPlaceholder="Tìm danh mục..."
        hideDefaultDetailAction
        createAction={{
            label: "Thêm danh mục",
            onPress: () =>
                Alert.alert(
                    "Thêm danh mục",
                    "Sẽ mở form thêm danh mục ở bước tiếp theo.",
                ),
        }}
        rowActions={[
            {
                label: "Sửa",
                tone: "neutral",
                onPress: (row) =>
                    Alert.alert(
                        "Sửa danh mục",
                        `Sẽ mở màn hình sửa cho ${row?.name || "danh mục"}.`,
                    ),
            },
        ]}
        columns={[
            { key: "id", label: "ID", width: 60 },
            { key: "name", label: "Tên danh mục", flex: 2 },
            { key: "slug", label: "Slug", flex: 1 },
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

export default CategoryListScreen;
