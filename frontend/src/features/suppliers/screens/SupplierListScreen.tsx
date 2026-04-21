import React from "react";
import { useNavigation } from "@react-navigation/native";
import { DataTableScreen, StatusBadge } from "../../../components";

const SupplierListScreen = () => {
    const navigation = useNavigation<any>();
    return (
        <DataTableScreen
            apiUrl="/suppliers"
            title="Nhà cung cấp"
            searchPlaceholder="Tìm mã, tên nhà cung cấp..."
            hideDefaultDetailAction
            createAction={{
                label: "Thêm NCC",
                onPress: () => navigation.navigate("SupplierForm"),
            }}
            rowActions={[
                {
                    label: "Sửa",
                    tone: "neutral",
                    onPress: (row) => navigation.navigate("SupplierForm", { id: row.id }),
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
};

export default SupplierListScreen;
