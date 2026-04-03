import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "../store/authStore";
import { View, ActivityIndicator } from "react-native";
import { theme } from "../utils/theme";
import { useResponsive } from "../utils/responsive";

// Import Screens
import LoginScreen from "../screens/LoginScreen";
import MainDrawerNavigator from "./MainDrawerNavigator";
import MobileTabNavigator from "./MobileTabNavigator";
import CustomerListScreen from "../screens/CustomerListScreen";
import PurchaseOrderListScreen from "../screens/PurchaseOrderListScreen";
import GoodsReceiptListScreen from "../screens/GoodsReceiptScreen";
import SupplierListScreen from "../screens/SupplierListScreen";
import CustomerReturnListScreen from "../screens/CustomerReturnListScreen";
import SupplierReturnListScreen from "../screens/SupplierReturnListScreen";
import StockAdjustmentListScreen from "../screens/StockAdjustmentListScreen";
import InventoryMovementListScreen from "../screens/InventoryMovementListScreen";
import ProductListScreen from "../screens/ProductListScreen";
import CategoryListScreen from "../screens/CategoryListScreen";
import CouponListScreen from "../screens/CouponListScreen";
import StaffListScreen from "../screens/StaffListScreen";
import WarehouseListScreen from "../screens/WarehouseListScreen";
import AiSqlChatScreen from "../screens/AiSqlChatScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const { token, isLoading, checkAuth } = useAuthStore();
    const { isDesktop } = useResponsive();

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
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerStyle: { backgroundColor: theme.colors.primary },
                    headerTintColor: theme.colors.primaryForeground,
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
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
