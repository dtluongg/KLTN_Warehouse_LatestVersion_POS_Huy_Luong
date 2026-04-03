import React from "react";
import { useWindowDimensions } from "react-native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { CustomDrawerContent } from "../components/CustomDrawerContent";

// Screens
import HomeScreen from "../screens/HomeScreen";
import PosScreen from "../screens/PosScreen";
import OrderListScreen from "../screens/OrderListScreen";
import CustomerListScreen from "../screens/CustomerListScreen";
import PurchaseOrderListScreen from "../screens/PurchaseOrderListScreen";
import GoodsReceiptListScreen from "../screens/GoodsReceiptScreen";
import SupplierListScreen from "../screens/SupplierListScreen";
import CustomerReturnListScreen from "../screens/CustomerReturnListScreen";
import SupplierReturnListScreen from "../screens/SupplierReturnListScreen";
import WarehouseListScreen from "../screens/WarehouseListScreen";
import StockAdjustmentListScreen from "../screens/StockAdjustmentListScreen";
import InventoryMovementListScreen from "../screens/InventoryMovementListScreen";
import InventoryStockScreen from "../screens/InventoryStockScreen";
import ProductListScreen from "../screens/ProductListScreen";
import CategoryListScreen from "../screens/CategoryListScreen";
import CouponListScreen from "../screens/CouponListScreen";
import StaffListScreen from "../screens/StaffListScreen";
import AiSqlChatScreen from "../screens/AiSqlChatScreen";
import { BREAKPOINTS } from "../utils/responsive";

const Drawer = createDrawerNavigator();

export default function MainDrawerNavigator() {
    const { width } = useWindowDimensions();
    const isLargeScreen = width >= BREAKPOINTS.desktop;

    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerShown: true,
                drawerType: isLargeScreen ? "permanent" : "front",
                headerLeft: isLargeScreen ? () => null : undefined,
                headerStyle: {
                    backgroundColor: "#059669",
                },
                headerTintColor: "#fff",
            }}
            initialRouteName="Overview"
        >
            {/* ── TỔNG QUAN ── */}
            <Drawer.Screen
                name="Overview"
                component={HomeScreen}
                options={{ title: "Tổng quan" }}
            />

            {/* ── BÁN HÀNG ── */}
            <Drawer.Screen
                name="Pos"
                component={PosScreen}
                options={{ title: "Bán hàng POS" }}
            />
            <Drawer.Screen
                name="Orders"
                component={OrderListScreen}
                options={{ title: "Đơn hàng" }}
            />
            <Drawer.Screen
                name="Customers"
                component={CustomerListScreen}
                options={{ title: "Khách hàng" }}
            />

            {/* ── MUA HÀNG & NHẬP KHO ── */}
            <Drawer.Screen
                name="PurchaseOrders"
                component={PurchaseOrderListScreen}
                options={{ title: "Đặt hàng NCC" }}
            />
            <Drawer.Screen
                name="GoodsReceipt"
                component={GoodsReceiptListScreen}
                options={{ title: "Nhập hàng (GR)" }}
            />
            <Drawer.Screen
                name="Suppliers"
                component={SupplierListScreen}
                options={{ title: "Nhà cung cấp" }}
            />

            {/* ── TRẢ HÀNG ── */}
            <Drawer.Screen
                name="CustomerReturns"
                component={CustomerReturnListScreen}
                options={{ title: "Trả hàng KH" }}
            />
            <Drawer.Screen
                name="SupplierReturns"
                component={SupplierReturnListScreen}
                options={{ title: "Trả hàng NCC" }}
            />

            {/* ── TỒN KHO VÀ KIỂM KHO ── */}
            <Drawer.Screen
                name="InventoryStock"
                component={InventoryStockScreen}
                options={{ title: "Tồn kho" }}
            />
            <Drawer.Screen
                name="StockAdjustments"
                component={StockAdjustmentListScreen}
                options={{ title: "Kiểm kho / Điều chỉnh" }}
            />
            <Drawer.Screen
                name="InventoryMovements"
                component={InventoryMovementListScreen}
                options={{ title: "Lịch sử nhập xuất kho" }}
            />

            {/* ── CẤU HÌNH ── */}
            <Drawer.Screen
                name="Products"
                component={ProductListScreen}
                options={{ title: "Sản phẩm" }}
            />
            <Drawer.Screen
                name="Categories"
                component={CategoryListScreen}
                options={{ title: "Danh mục sản phẩm" }}
            />
            <Drawer.Screen
                name="Coupons"
                component={CouponListScreen}
                options={{ title: "Mã giảm giá" }}
            />
            <Drawer.Screen
                name="Staff"
                component={StaffListScreen}
                options={{ title: "Nhân viên" }}
            />
            <Drawer.Screen
                name="Warehouse"
                component={WarehouseListScreen}
                options={{ title: "Kho hàng" }}
            />

            {/* ── AI & HỖ TRỢ ── */}
            <Drawer.Screen
                name="AiSqlChat"
                component={AiSqlChatScreen}
                options={{ title: "AI Chat SQL" }}
            />
        </Drawer.Navigator>
    );
}
