import React from "react";
import { Text } from "react-native";
import { DataTableScreen } from "../components";

const InventoryMovementListScreen = () => (
    <DataTableScreen
        apiUrl="/inventory-movements"
        title="Lịch sử nhập xuất kho"
        searchPlaceholder="Tìm theo sản phẩm, kho, loại..."
        hideDefaultDetailAction
        columns={[
            { key: "id", label: "ID", width: 60 },
            { key: "product.sku", label: "SKU", width: 120 },
            { key: "product.name", label: "Sản phẩm", flex: 2 },
            { key: "warehouse.name", label: "Kho", flex: 1 },
            { key: "movementType", label: "Loại", flex: 1 },
            { key: "qty", label: "SL", width: 70 },
            { key: "refTable", label: "Nguồn", flex: 1 },
            { key: "refId", label: "Mã chứng từ", flex: 1 },
            { key: "createdBy.fullName", label: "Người tạo", flex: 1 },
            { key: "note", label: "Ghi chú", flex: 1.5 },
            {
                key: "createdAt",
                label: "Thời gian",
                flex: 1,
                render: (v: any) => (
                    <Text>
                        {v ? new Date(v).toLocaleDateString("vi-VN") : "—"}
                    </Text>
                ),
            },
        ]}
    />
);

export default InventoryMovementListScreen;
