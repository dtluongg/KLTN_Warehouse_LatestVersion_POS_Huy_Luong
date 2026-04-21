import React from "react";
import { Image, View, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { DataTableScreen, StatusBadge, formatMoney } from "../../../components";

const ProductListScreen = () => {
    const navigation = useNavigation<any>();
    return (
        <DataTableScreen
            apiUrl="/products"
            title="Sản phẩm"
            searchPlaceholder="Tìm theo SKU, tên sản phẩm..."
            hideDefaultDetailAction
            createAction={{
                label: "Thêm sản phẩm",
                onPress: () => navigation.navigate("ProductForm"),
            }}
            rowActions={[
                {
                    label: "Sửa",
                    tone: "neutral",
                    onPress: (row) => navigation.navigate("ProductForm", { id: row.id }),
                },
            ]}
            columns={[
                {
                    key: "imageUrl",
                    label: "Ảnh",
                    width: 60,
                    render: (v: string) => (
                        v
                            ? <Image source={{ uri: v }} style={{ width: 40, height: 40, borderRadius: 4, resizeMode: "cover" }} />
                            : <View style={{ width: 40, height: 40, borderRadius: 4, backgroundColor: "#E2E8F0", justifyContent: "center", alignItems: "center" }}>
                                <Text style={{ fontSize: 10, color: "#64748B" }}>Trống</Text>
                              </View>
                    ),
                },
                { key: "sku", label: "SKU", width: 120 },
                { key: "barcode", label: "Barcode", width: 130 },
                { key: "name", label: "Tên sản phẩm", flex: 2 },
                { key: "shortName", label: "Tên ngắn", flex: 1 },
                { key: "categoryName", label: "Danh mục", flex: 1 },
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
                    render: (v: any) => <StatusBadge status={v ? "ACTIVE" : "INACTIVE"} />,
                },
            ]}
        />
    );
};

export default ProductListScreen;
