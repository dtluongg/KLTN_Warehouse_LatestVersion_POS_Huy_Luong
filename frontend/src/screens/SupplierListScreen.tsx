import React from "react";
import DataTableScreen, { StatusBadge } from "../components/DataTableScreen";

const SupplierListScreen = () => (
    <DataTableScreen
        apiUrl="/suppliers"
        searchPlaceholder="Tìm mã, tên nhà cung cấp..."
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
