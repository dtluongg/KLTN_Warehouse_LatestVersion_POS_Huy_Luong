import React from "react";
import DataTableScreen, {
    StatusBadge,
    formatMoney,
} from "../components/DataTableScreen";

const ProductListScreen = () => (
    <DataTableScreen
        apiUrl="/products"
        searchPlaceholder="Tìm theo SKU, tên sản phẩm..."
        columns={[
            { key: "sku", label: "SKU", width: 120 },
            { key: "barcode", label: "Barcode", width: 130 },
            { key: "name", label: "Tên sản phẩm", flex: 2 },
            { key: "shortName", label: "Tên ngắn", flex: 1 },
            { key: "category.name", label: "Danh mục", flex: 1 },
            {
                key: "salePrice",
                label: "Giá bán",
                flex: 1,
                render: (v: any) => <>{formatMoney(v)}</>,
            },
            {
                key: "avgCost",
                label: "Giá vốn TB",
                flex: 1,
                render: (v: any) => <>{formatMoney(v)}</>,
            },
            {
                key: "lastPurchaseCost",
                label: "Giá nhập gần nhất",
                flex: 1,
                render: (v: any) => <>{formatMoney(v)}</>,
            },
            { key: "vatRate", label: "VAT %", width: 90 },
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

export default ProductListScreen;
