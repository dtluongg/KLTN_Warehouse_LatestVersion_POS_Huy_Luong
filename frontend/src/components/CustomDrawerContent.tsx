import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
} from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { useAuthStore } from "../store/authStore";
import { theme } from "../utils/theme";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

// Type item trong menu
type MenuItem = {
    label: string;
    icon: string;
    route: string;
    isHighlight?: boolean;
};
type MenuSection = { section: string | null; items: MenuItem[] };

// Các nhóm Menu theo nghiệp vụ
const MENU_SECTIONS: MenuSection[] = [
    {
        section: null,
        items: [{ label: "Tổng quan", icon: "grid", route: "Overview" }],
    },
    {
        section: "BÁN HÀNG",
        items: [
            {
                label: "Bán hàng POS",
                icon: "shopping-bag",
                route: "Pos",
                isHighlight: true,
            },
            { label: "Đơn hàng", icon: "shopping-cart", route: "Orders" },
            { label: "Khách hàng", icon: "users", route: "Customers" },
        ],
    },
    {
        section: "MUA HÀNG & NHẬP KHO",
        items: [
            {
                label: "Đặt hàng NCC",
                icon: "clipboard",
                route: "PurchaseOrders",
            },
            {
                label: "Nhập hàng (GR)",
                icon: "file-text",
                route: "GoodsReceipt",
                isHighlight: true,
            },
            { label: "Nhà cung cấp", icon: "truck", route: "Suppliers" },
        ],
    },
    {
        section: "TRẢ HÀNG",
        items: [
            {
                label: "Trả hàng KH",
                icon: "corner-down-left",
                route: "CustomerReturns",
            },
            {
                label: "Trả hàng NCC",
                icon: "corner-up-right",
                route: "SupplierReturns",
            },
        ],
    },
    {
        section: "TỒN KHO VÀ KIỂM KHO",
        items: [
            { label: "Tồn kho", icon: "box", route: "InventoryStock" },
            {
                label: "Kiểm kho / Điều chỉnh",
                icon: "sliders",
                route: "StockAdjustments",
            },
            {
                label: "Lịch sử nhập xuất kho",
                icon: "activity",
                route: "InventoryMovements",
            },
        ],
    },
    {
        section: "CẤU HÌNH",
        items: [
            { label: "Sản phẩm", icon: "package", route: "Products" },
            { label: "Danh mục sản phẩm", icon: "folder", route: "Categories" },
            { label: "Mã giảm giá", icon: "tag", route: "Coupons" },
            { label: "Nhân viên", icon: "user-check", route: "Staff" },
            { label: "Kho hàng", icon: "home", route: "Warehouse" },
        ],
    },
    {
        section: "AI & HỖ TRỢ",
        items: [
            {
                label: "AI Chat SQL",
                icon: "message-circle",
                route: "AiSqlChat",
            },
        ],
    },
];

export const CustomDrawerContent = (props: any) => {
    const { username, role, logout } = useAuthStore();

    // Trạng thái màn hình hiện tại để tô màu Active chữ xanh
    const currentRouteName = props.state.routeNames[props.state.index];

    return (
        <View style={styles.container}>
            {/* Header (Logo + Brand) */}
            <View style={styles.header}>
                <View style={styles.logoBox}>
                    <MaterialCommunityIcons
                        name="leaf"
                        size={24}
                        color={theme.colors.primary}
                    />
                </View>
                <Text style={styles.headerTitle}>Sáu Hiệp</Text>
            </View>

            <DrawerContentScrollView
                {...props}
                contentContainerStyle={{ paddingTop: 0 }}
            >
                {/* User Card - compact ngang */}
                <View style={styles.userCard}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>
                            {username ? username.charAt(0).toUpperCase() : "?"}
                        </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.userName} numberOfLines={1}>
                            {username || "Nhân viên"}
                        </Text>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>
                                {role === "ADMIN"
                                    ? "Quản trị viên"
                                    : role === "SALES_STAFF"
                                      ? "Bán hàng"
                                      : "Kho"}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Menu Groups */}
                <View style={styles.menuContainer}>
                    {MENU_SECTIONS.map((group, groupIndex) => (
                        <View key={groupIndex}>
                            {/* Section Header */}
                            {group.section && (
                                <Text style={styles.sectionHeader}>
                                    {group.section}
                                </Text>
                            )}
                            {/* Section Items */}
                            {group.items.map((item, itemIndex) => {
                                const isActive =
                                    currentRouteName === item.route;
                                const itemColor = isActive
                                    ? theme.colors.primary
                                    : theme.colors.mutedForeground;
                                return (
                                    <TouchableOpacity
                                        key={itemIndex}
                                        style={[
                                            styles.menuItem,
                                            isActive && styles.menuItemActive,
                                            item.isHighlight &&
                                                !isActive &&
                                                styles.menuItemHighlight,
                                        ]}
                                        onPress={() =>
                                            props.navigation.navigate(
                                                item.route,
                                            )
                                        }
                                    >
                                        <Feather
                                            name={item.icon as any}
                                            size={18}
                                            color={
                                                item.isHighlight && !isActive
                                                    ? theme.colors.primary
                                                    : itemColor
                                            }
                                        />
                                        <Text
                                            style={[
                                                styles.menuLabel,
                                                isActive &&
                                                    styles.menuLabelActive,
                                                item.isHighlight &&
                                                    !isActive && {
                                                        color: theme.colors
                                                            .primary,
                                                        fontWeight: "600",
                                                    },
                                            ]}
                                        >
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ))}
                </View>
            </DrawerContentScrollView>

            {/* Footer Drawer */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Feather
                        name="log-out"
                        size={20}
                        color={theme.colors.error}
                    />
                    <Text style={styles.logoutText}>Đăng xuất</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.surface,
    },
    header: {
        height: 64,
        backgroundColor: theme.colors.primary,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: theme.spacing.lg,
    },
    logoBox: {
        backgroundColor: theme.colors.primaryLight,
        padding: 6,
        borderRadius: theme.borderRadius.sm,
        marginRight: 10,
    },
    headerTitle: {
        ...theme.typography.h3,
        color: theme.colors.primaryForeground,
    },
    userCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        backgroundColor: "#f8fafc",
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    avatarCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.primaryLight,
        borderWidth: 1.5,
        borderColor: theme.colors.primary,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    avatarText: {
        fontSize: 14,
        fontWeight: "700",
        color: theme.colors.primary,
    },
    userName: {
        fontSize: 13,
        fontWeight: "700",
        color: theme.colors.foreground,
        marginBottom: 2,
    },
    roleBadge: {
        backgroundColor: theme.colors.primaryLight,
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: "#a7f3d0",
        alignSelf: "flex-start",
    },
    roleText: {
        fontSize: 9,
        fontWeight: "600",
        color: theme.colors.primary,
    },
    menuContainer: {
        padding: theme.spacing.md,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: theme.borderRadius.md,
        marginBottom: 4,
    },
    menuItemActive: {
        backgroundColor: theme.colors.primaryLight,
    },
    menuItemHighlight: {
        borderWidth: 1,
        borderColor: theme.colors.primaryLight,
    },
    menuLabel: {
        fontSize: 14,
        fontWeight: "500",
        color: theme.colors.mutedForeground,
        marginLeft: 12,
    },
    menuLabelActive: {
        color: theme.colors.primary,
        fontWeight: "700",
    },
    sectionHeader: {
        fontSize: 10,
        fontWeight: "700",
        color: theme.colors.mutedForeground,
        letterSpacing: 0.8,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 4,
        opacity: 0.6,
    },
    footer: {
        padding: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
    },
    logoutText: {
        fontSize: 14,
        fontWeight: "600",
        color: theme.colors.error,
        marginLeft: 12,
    },
});
