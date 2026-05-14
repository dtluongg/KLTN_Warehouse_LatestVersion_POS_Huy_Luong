import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "../store/authStore";
import { View, ActivityIndicator } from "react-native";
import { useTheme } from "../hooks/useTheme";
import { useResponsive } from "../utils/responsive";

// Import Screens
import LoginScreen from "../features/auth/screens/LoginScreen";
import HomeScreen from "../features/overview/screens/HomeScreen";
import MainDrawerNavigator from "./MainDrawerNavigator";
import MobileTabNavigator from "./MobileTabNavigator";
import CustomerListScreen from "../features/customers/screens/CustomerListScreen";
import PurchaseOrderListScreen from "../features/purchase-orders/screens/PurchaseOrderListScreen";
import GoodsReceiptListScreen from "../features/goods-receipts/screens/GoodsReceiptScreen";
import SupplierListScreen from "../features/suppliers/screens/SupplierListScreen";
import CustomerReturnListScreen from "../features/customer-returns/screens/CustomerReturnListScreen";
import SupplierReturnListScreen from "../features/supplier-returns/screens/SupplierReturnListScreen";
import StockAdjustmentListScreen from "../features/stock-adjustments/screens/StockAdjustmentListScreen";
import InventoryMovementListScreen from "../features/inventory-movements/screens/InventoryMovementListScreen";
import ProductListScreen from "../features/products/screens/ProductListScreen";
import CategoryListScreen from "../features/categories/screens/CategoryListScreen";
import CouponListScreen from "../features/coupons/screens/CouponListScreen";
import StaffListScreen from "../features/staff/screens/StaffListScreen";
import WarehouseListScreen from "../features/warehouses/screens/WarehouseListScreen";
import AiSqlChatScreen from "../features/ai-sql-chat/screens/AiSqlChatScreen";
import PurchaseOrderFormScreen from "../features/purchase-orders/screens/PurchaseOrderFormScreen";
import GoodsReceiptFormScreen from "../features/goods-receipts/screens/GoodsReceiptFormScreen";
import CustomerReturnFormScreen from "../features/customer-returns/screens/CustomerReturnFormScreen";
import SupplierReturnFormScreen from "../features/supplier-returns/screens/SupplierReturnFormScreen";
import StockAdjustmentFormScreen from "../features/stock-adjustments/screens/StockAdjustmentFormScreen";
import SupplierFormScreen from "../features/suppliers/screens/SupplierFormScreen";
import CategoryFormScreen from "../features/categories/screens/CategoryFormScreen";
import ProductFormScreen from "../features/products/screens/ProductFormScreen";
import CouponFormScreen from "../features/coupons/screens/CouponFormScreen";
import StaffFormScreen from "../features/staff/screens/StaffFormScreen";
import CustomerFormScreen from "../features/customers/screens/CustomerFormScreen";
import WarehouseFormScreen from "../features/warehouses/screens/WarehouseFormScreen";
import WarehouseStatisticsScreen from "../features/reports/screens/WarehouseStatisticsScreen";
import RevenueReportScreen from "../features/reports/screens/RevenueReportScreen";
import SalesReportsScreen from "../features/reports/screens/SalesReportsScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const { token, isLoading, checkAuth } = useAuthStore();
    const { isDesktop } = useResponsive();
    const { colors } = useTheme();

    useEffect(() => {
        checkAuth();
    }, []);

    if (isLoading) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerStyle: { backgroundColor: colors.primary },
                    headerTintColor: colors.buttonText,
                }}
            >
                {token == null ? (
                    <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{ headerShown: false }}
                    />
                ) : (
                    <>
                        <Stack.Screen
                            name="Main"
                            component={
                                isDesktop
                                    ? MainDrawerNavigator
                                    : MobileTabNavigator
                            }
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Customers"
                            component={CustomerListScreen}
                            options={{ title: "Khách hàng" }}
                        />
                        <Stack.Screen
                            name="PurchaseOrders"
                            component={PurchaseOrderListScreen}
                            options={{ title: "Đặt hàng NCC" }}
                        />
                        <Stack.Screen
                            name="GoodsReceipt"
                            component={GoodsReceiptListScreen}
                            options={{ title: "Nhập hàng (GR)" }}
                        />
                        <Stack.Screen
                            name="Suppliers"
                            component={SupplierListScreen}
                            options={{ title: "Nhà cung cấp" }}
                        />
                        <Stack.Screen
                            name="CustomerReturns"
                            component={CustomerReturnListScreen}
                            options={{ title: "Trả hàng KH" }}
                        />
                        <Stack.Screen
                            name="SupplierReturns"
                            component={SupplierReturnListScreen}
                            options={{ title: "Trả hàng NCC" }}
                        />
                        <Stack.Screen
                            name="StockAdjustments"
                            component={StockAdjustmentListScreen}
                            options={{ title: "Kiểm kho / Điều chỉnh" }}
                        />
                        <Stack.Screen
                            name="InventoryMovements"
                            component={InventoryMovementListScreen}
                            options={{ title: "Lịch sử nhập xuất kho" }}
                        />
                        <Stack.Screen
                            name="Products"
                            component={ProductListScreen}
                            options={{ title: "Sản phẩm" }}
                        />
                        <Stack.Screen
                            name="Categories"
                            component={CategoryListScreen}
                            options={{ title: "Danh mục sản phẩm" }}
                        />
                        <Stack.Screen
                            name="Coupons"
                            component={CouponListScreen}
                            options={{ title: "Mã giảm giá" }}
                        />
                        <Stack.Screen
                            name="Staff"
                            component={StaffListScreen}
                            options={{ title: "Nhân viên" }}
                        />
                        <Stack.Screen
                            name="Warehouse"
                            component={WarehouseListScreen}
                            options={{ title: "Kho hàng" }}
                        />
                        <Stack.Screen
                            name="AiSqlChat"
                            component={AiSqlChatScreen}
                            options={{ title: "AI Chat SQL" }}
                        />
                        <Stack.Screen
                            name="WarehouseStatistics"
                            component={WarehouseStatisticsScreen}
                            options={{ title: "Thống kê kho" }}
                        />
                        <Stack.Screen
                            name="PurchaseOrderForm"
                            component={PurchaseOrderFormScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="GoodsReceiptForm"
                            component={GoodsReceiptFormScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="CustomerReturnForm"
                            component={CustomerReturnFormScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="SupplierReturnForm"
                            component={SupplierReturnFormScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="StockAdjustmentForm"
                            component={StockAdjustmentFormScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="SupplierForm"
                            component={SupplierFormScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="CategoryForm"
                            component={CategoryFormScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="ProductForm"
                            component={ProductFormScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="CouponForm"
                            component={CouponFormScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="StaffForm"
                            component={StaffFormScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="CustomerForm"
                            component={CustomerFormScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="WarehouseForm"
                            component={WarehouseFormScreen}
                            options={{ headerShown: false }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
