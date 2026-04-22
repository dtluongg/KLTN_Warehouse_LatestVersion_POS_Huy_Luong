import React from "react";
import { useWindowDimensions } from "react-native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { CustomDrawerContent } from "../components/CustomDrawerContent";
import { useTheme } from "../hooks/useTheme";

// Screens
import HomeScreen from "../features/overview/screens/HomeScreen";
import PosScreen from "../features/pos/screens/PosScreen";
import OrderListScreen from "../features/orders/screens/OrderListScreen";
import CustomerListScreen from "../features/customers/screens/CustomerListScreen";
import PurchaseOrderListScreen from "../features/purchase-orders/screens/PurchaseOrderListScreen";
import GoodsReceiptListScreen from "../features/goods-receipts/screens/GoodsReceiptScreen";
import SupplierListScreen from "../features/suppliers/screens/SupplierListScreen";
import CustomerReturnListScreen from "../features/customer-returns/screens/CustomerReturnListScreen";
import SupplierReturnListScreen from "../features/supplier-returns/screens/SupplierReturnListScreen";
import WarehouseListScreen from "../features/warehouses/screens/WarehouseListScreen";
import StockAdjustmentListScreen from "../features/stock-adjustments/screens/StockAdjustmentListScreen";
import InventoryMovementListScreen from "../features/inventory-movements/screens/InventoryMovementListScreen";
import InventoryStockScreen from "../features/inventory-stock/screens/InventoryStockScreen";
import ProductListScreen from "../features/products/screens/ProductListScreen";
import CategoryListScreen from "../features/categories/screens/CategoryListScreen";
import CouponListScreen from "../features/coupons/screens/CouponListScreen";
import StaffListScreen from "../features/staff/screens/StaffListScreen";
import AiSqlChatScreen from "../features/ai-sql-chat/screens/AiSqlChatScreen";
import WarehouseStatisticsScreen from "../features/reports/screens/WarehouseStatisticsScreen";
import { BREAKPOINTS } from "../utils/responsive";

const Drawer = createDrawerNavigator();

export default function MainDrawerNavigator() {
    const { width } = useWindowDimensions();
    const isLargeScreen = width >= BREAKPOINTS.desktop;
    const { colors } = useTheme();

    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerShown: true,
                drawerType: isLargeScreen ? "permanent" : "front",
                headerLeft: isLargeScreen ? () => null : undefined,
                headerStyle: {
                    backgroundColor: colors.primary,
                },
                headerTintColor: colors.buttonText,
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
            <Drawer.Screen
                name="WarehouseStatistics"
                component={WarehouseStatisticsScreen}
                options={{ title: "Thống kê kho" }}
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
