import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { theme } from "../utils/theme";
import { useAuthStore } from "../store/authStore";
import { isRouteAllowedByRole } from "../utils/roleAccess";

import HomeScreen from "../screens/HomeScreen";
import PosScreen from "../screens/PosScreen";
import InventoryStockScreen from "../screens/InventoryStockScreen";
import OrderListScreen from "../screens/OrderListScreen";
import MoreMenuScreen from "../screens/MoreMenuScreen";

const Tab = createBottomTabNavigator();

const TAB_ICON_BY_ROUTE: Record<
    string,
    React.ComponentProps<typeof Feather>["name"]
> = {
    Overview: "grid",
    Pos: "shopping-bag",
    InventoryStock: "archive",
    Orders: "file-text",
    More: "menu",
};

export default function MobileTabNavigator() {
    const role = useAuthStore((state) => state.role);

    return (
        <Tab.Navigator
            initialRouteName="Overview"
            screenOptions={({ route }) => ({
                tabBarButton: (props) => {
                    const isAllowed = isRouteAllowedByRole(role, route.name);

                    return (
                        <TouchableOpacity
                            {...props}
                            disabled={!isAllowed}
                            style={[props.style, !isAllowed && { opacity: 0.45 }]}
                        />
                    );
                },
                headerStyle: { backgroundColor: theme.colors.primary },
                headerTintColor: theme.colors.primaryForeground,
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.mutedForeground,
                tabBarStyle: {
                    height: 64,
                    paddingTop: 6,
                    paddingBottom: 8,
                    borderTopColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: "600",
                },
                tabBarIcon: ({ color, size }) => (
                    <Feather
                        name={TAB_ICON_BY_ROUTE[route.name] || "circle"}
                        size={size}
                        color={color}
                    />
                ),
            })}
        >
            <Tab.Screen
                name="Overview"
                component={HomeScreen}
                options={{ title: "Tổng quan", tabBarLabel: "Tổng quan" }}
            />
            <Tab.Screen
                name="Pos"
                component={PosScreen}
                options={{ title: "Bán hàng POS", tabBarLabel: "POS" }}
            />
            <Tab.Screen
                name="InventoryStock"
                component={InventoryStockScreen}
                options={{ title: "Tồn kho", tabBarLabel: "Tồn kho" }}
            />
            <Tab.Screen
                name="Orders"
                component={OrderListScreen}
                options={{ title: "Đơn hàng", tabBarLabel: "Đơn hàng" }}
            />
            <Tab.Screen
                name="More"
                component={MoreMenuScreen}
                options={{ title: "Thêm", tabBarLabel: "Thêm" }}
            />
        </Tab.Navigator>
    );
}
