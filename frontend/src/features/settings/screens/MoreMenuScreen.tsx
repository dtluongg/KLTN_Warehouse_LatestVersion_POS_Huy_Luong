import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../../../utils/theme";
import { useAuthStore } from "../../../store/authStore";
import { isRouteAllowedByRole } from "../../../utils/roleAccess";

type MenuGroup = {
    section: string;
    items: Array<{
        label: string;
        route: string;
        icon: React.ComponentProps<typeof Feather>["name"];
    }>;
};

const MENU_GROUPS: MenuGroup[] = [
    {
        section: "AI & Hỗ trợ",
        items: [
            {
                label: "AI Chat SQL",
                route: "AiSqlChat",
                icon: "message-circle",
            },
        ],
    },
    {
        section: "Bán hàng",
        items: [{ label: "Khách hàng", route: "Customers", icon: "users" }],
    },
    {
        section: "Mua hàng và nhập kho",
        items: [
            {
                label: "Đặt hàng NCC",
                route: "PurchaseOrders",
                icon: "clipboard",
            },
            {
                label: "Nhập hàng (GR)",
                route: "GoodsReceipt",
                icon: "file-plus",
            },
            { label: "Nhà cung cấp", route: "Suppliers", icon: "truck" },
        ],
    },
    {
        section: "Tra hàng",
        items: [
            {
                label: "Tra hàng khách hàng",
                route: "CustomerReturns",
                icon: "corner-down-left",
            },
            {
                label: "Tra hàng nhà cung cấp",
                route: "SupplierReturns",
                icon: "corner-up-right",
            },
        ],
    },
    {
        section: "Tồn kho và kiểm kho",
        items: [
            {
                label: "Thống kê kho",
                route: "WarehouseStatistics",
                icon: "bar-chart-2",
            },
            {
                label: "Kiểm kho / điều chỉnh",
                route: "StockAdjustments",
                icon: "sliders",
            },
            {
                label: "Lịch sử nhập xuất kho",
                route: "InventoryMovements",
                icon: "activity",
            },
        ],
    },
    {
        section: "Cấu hình",
        items: [
            { label: "Sản phẩm", route: "Products", icon: "package" },
            { label: "Danh mục sản phẩm", route: "Categories", icon: "folder" },
            { label: "Mã giảm giá", route: "Coupons", icon: "tag" },
            { label: "Nhân viên", route: "Staff", icon: "user-check" },
            { label: "Kho hàng", route: "Warehouse", icon: "home" },
        ],
    },
];

const MoreMenuScreen = () => {
    const navigation = useNavigation<any>();
    const role = useAuthStore((state) => state.role);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
        >
            {MENU_GROUPS.map((group) => (
                <View key={group.section} style={styles.groupBox}>
                    <Text style={styles.sectionTitle}>{group.section}</Text>
                    {group.items.map((item) => (
                        (() => {
                            const isAllowed = isRouteAllowedByRole(
                                role,
                                item.route,
                            );

                            return (
                        <TouchableOpacity
                            key={item.route}
                            disabled={!isAllowed}
                            style={[
                                styles.menuItem,
                                !isAllowed && styles.menuItemDisabled,
                            ]}
                            onPress={() => {
                                if (!isAllowed) {
                                    return;
                                }
                                navigation.navigate(item.route);
                            }}
                        >
                            <View style={styles.menuLeft}>
                                <View style={styles.iconBox}>
                                    <Feather
                                        name={item.icon}
                                        size={16}
                                        color={
                                            isAllowed
                                                ? theme.colors.primary
                                                : theme.colors.mutedForeground
                                        }
                                    />
                                </View>
                                <Text
                                    style={[
                                        styles.menuText,
                                        !isAllowed && styles.menuTextDisabled,
                                    ]}
                                >
                                    {item.label}
                                </Text>
                            </View>
                            <Feather
                                name={isAllowed ? "chevron-right" : "lock"}
                                size={16}
                                color={theme.colors.mutedForeground}
                            />
                        </TouchableOpacity>
                            );
                        })()
                    ))}
                </View>
            ))}
        </ScrollView>
    );
};

export default MoreMenuScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        padding: theme.spacing.md,
        paddingBottom: theme.spacing.xl,
        gap: theme.spacing.md,
    },
    groupBox: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.lg,
        overflow: "hidden",
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "600",
        lineHeight: 16,
        color: theme.colors.mutedForeground,
        textTransform: "uppercase",
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 8,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    menuItemDisabled: {
        opacity: 0.45,
    },
    menuLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    iconBox: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.primaryLight,
    },
    menuText: {
        ...theme.typography.body,
        color: theme.colors.foreground,
        fontSize: 15,
    },
    menuTextDisabled: {
        color: theme.colors.mutedForeground,
    },
});

