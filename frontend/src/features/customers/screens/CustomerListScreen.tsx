import React from "react";
import { useNavigation } from "@react-navigation/native";
import { DataTableScreen, StatusBadge } from "../../../components";

const CustomerListScreen = () => {
    const navigation = useNavigation<any>();
    return (
        <DataTableScreen
            apiUrl="/customers"
            title="Khách hàng"
            searchPlaceholder="Tìm mã, tên, SĐT khách hàng..."
            hideDefaultDetailAction
            createAction={{
                label: "Thêm KH",
                onPress: () => navigation.navigate("CustomerForm"),
            }}
            rowActions={[
                {
                    label: "Sửa",
                    tone: "neutral",
                    showOnDesktop: true,
                    showOnMobile: true,
                    onPress: (row) => navigation.navigate("CustomerForm", { id: row.id }),
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
                    render: (v: any) => <StatusBadge status={v ? "ACTIVE" : "INACTIVE"} />,
                },
            ]}
        />
    );
};

export default CustomerListScreen;
