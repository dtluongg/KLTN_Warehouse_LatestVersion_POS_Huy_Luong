import React from "react";
import { useNavigation } from "@react-navigation/native";
import { DataTableScreen, StatusBadge } from "../../../components";

const CategoryListScreen = () => {
    const navigation = useNavigation<any>();
    return (
        <DataTableScreen
            apiUrl="/categories"
            title="Danh mục sản phẩm"
            searchPlaceholder="Tìm danh mục..."
            hideDefaultDetailAction
            createAction={{
                label: "Thêm danh mục",
                onPress: () => navigation.navigate("CategoryForm"),
            }}
            rowActions={[
                {
                    label: "Sửa",
                    tone: "neutral",
                    onPress: (row) => navigation.navigate("CategoryForm", { id: row.id }),
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
                    render: (v: any) => <StatusBadge status={v ? "ACTIVE" : "INACTIVE"} />,
                },
            ]}
        />
    );
};

export default CategoryListScreen;
