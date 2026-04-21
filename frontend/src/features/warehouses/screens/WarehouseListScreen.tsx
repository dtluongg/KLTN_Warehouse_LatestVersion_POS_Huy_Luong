import React from "react";
import { useNavigation } from "@react-navigation/native";
import { DataTableScreen, StatusBadge } from "../../../components";

const WarehouseListScreen = () => {
    const navigation = useNavigation<any>();
    return (
        <DataTableScreen
            apiUrl="/warehouses"
            title="Kho hàng"
            searchPlaceholder="Tìm mã, tên kho..."
            hideDefaultDetailAction
            createAction={{
                label: "Thêm kho",
                onPress: () => navigation.navigate("WarehouseForm"),
            }}
            rowActions={[
                {
                    label: "Sửa",
                    tone: "neutral",
                    onPress: (row) => navigation.navigate("WarehouseForm", { id: row.id }),
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
                    render: (v: any) => <StatusBadge status={v ? "ACTIVE" : "INACTIVE"} />,
                },
            ]}
        />
    );
};

export default WarehouseListScreen;
