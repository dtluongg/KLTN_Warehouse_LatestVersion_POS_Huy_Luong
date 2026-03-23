import React from "react";
import DataTableScreen, { StatusBadge } from "../components/DataTableScreen";

const CustomerListScreen = () => (
    <DataTableScreen
        apiUrl="/customers"
        searchPlaceholder="Tìm mã, tên, SĐT khách hàng..."
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
