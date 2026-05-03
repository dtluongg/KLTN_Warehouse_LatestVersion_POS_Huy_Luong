import React from "react";
import {
    View,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../hooks/useTheme";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { getRoleLabel, isRouteAllowedByRole } from "../utils/roleAccess";
import { Typography } from "./ui/Typography";

type MenuItem = {
    label: string;
    icon: string;
    route: string;
    isHighlight?: boolean;
};
type MenuSection = { section: string | null; items: MenuItem[] };

const MENU_SECTIONS: MenuSection[] = [
    {
        section: null,
        items: [{ label: "Tổng quan", icon: "grid", route: "Overview" }],
    },
    {
        section: "BÁN HÀNG",
        items: [
            { label: "Bán hàng POS", icon: "shopping-bag", route: "Pos", isHighlight: true },
            { label: "Đơn hàng", icon: "shopping-cart", route: "Orders" },
            { label: "Khách hàng", icon: "users", route: "Customers" },
        ],
    },
    {
        section: "MUA HÀNG & NHẬP KHO",
        items: [
            { label: "Đặt hàng NCC", icon: "clipboard", route: "PurchaseOrders" },
            { label: "Nhập hàng (GR)", icon: "file-text", route: "GoodsReceipt", isHighlight: true },
            { label: "Nhà cung cấp", icon: "truck", route: "Suppliers" },
        ],
    },
    {
        section: "TRẢ HÀNG",
        items: [
            { label: "Trả hàng KH", icon: "corner-down-left", route: "CustomerReturns" },
            { label: "Trả hàng NCC", icon: "corner-up-right", route: "SupplierReturns" },
        ],
    },
    {
        section: "TỒN KHO VÀ KIỂM KHO",
        items: [
            { label: "Tồn kho", icon: "box", route: "InventoryStock" },
            { label: "Kiểm kho / Điều chỉnh", icon: "sliders", route: "StockAdjustments" },
            { label: "Lịch sử nhập xuất kho", icon: "activity", route: "InventoryMovements" },
            { label: "Thống kê kho", icon: "bar-chart-2", route: "WarehouseStatistics", isHighlight: true },
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
            { label: "AI Chat SQL", icon: "message-circle", route: "AiSqlChat" },
        ],
    },
];

export const CustomDrawerContent = (props: any) => {
    const { username, role, logout } = useAuthStore();
    const { colors, metrics, mode } = useTheme();

    const currentRouteName = props.state.routeNames[props.state.index];
    const isDark = mode === 'dark';

    return (
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
            {/* Header (Logo + Brand) */}
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <View style={[styles.logoBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <MaterialCommunityIcons
                        name="leaf"
                        size={24}
                        color={colors.buttonText}
                    />
                </View>
                <Typography variant="heading2" color={colors.buttonText}>Sáu Hiệp</Typography>
            </View>

            <DrawerContentScrollView
                {...props}
                contentContainerStyle={{ paddingTop: 0 }}
            >
                {/* User Card */}
                <View style={[
                    styles.userCard, 
                    { 
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                        borderBottomColor: colors.border 
                    }
                ]}>
                    <View style={[
                        styles.avatarCircle, 
                        { backgroundColor: 'rgba(0,113,227,0.1)', borderColor: colors.primary }
                    ]}>
                        <Typography variant="captionBold" color={colors.primary}>
                            {username ? username.charAt(0).toUpperCase() : "?"}
                        </Typography>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Typography variant="bodyEmphasized" color={colors.textPrimary} numberOfLines={1}>
                            {username || "Nhân viên"}
                        </Typography>
                        <View style={[styles.roleBadge, { backgroundColor: 'rgba(0,113,227,0.1)', borderColor: colors.primary }]}>
                            <Typography variant="micro" color={colors.primary}>
                                {getRoleLabel(role)}
                            </Typography>
                        </View>
                    </View>
                </View>

                {/* Menu Groups */}
                <View style={[styles.menuContainer, { padding: metrics.spacing.md }]}>
                    {MENU_SECTIONS.map((group, groupIndex) => (
                        <View key={groupIndex}>
                            {/* Section Header */}
                            {group.section && (
                                <Typography 
                                    variant="micro" 
                                    color={colors.textDisabled} 
                                    style={styles.sectionHeader}
                                >
                                    {group.section}
                                </Typography>
                            )}
                            {/* Section Items */}
                            {group.items.map((item, itemIndex) => {
                                const isActive = currentRouteName === item.route;
                                const isAllowed = isRouteAllowedByRole(role, item.route);
                                const itemColor = isActive
                                    ? colors.primary
                                    : colors.textSecondary;

                                return (
                                    <TouchableOpacity
                                        key={itemIndex}
                                        disabled={!isAllowed}
                                        style={[
                                            styles.menuItem,
                                            { borderRadius: metrics.borderRadius.medium },
                                            isActive && { backgroundColor: 'rgba(0,113,227,0.1)' },
                                            item.isHighlight && !isActive && { 
                                                borderWidth: 1, 
                                                borderColor: 'rgba(0,113,227,0.2)' 
                                            },
                                            !isAllowed && { opacity: 0.45 },
                                        ]}
                                        onPress={() => {
                                            if (!isAllowed) return;
                                            props.navigation.navigate(item.route);
                                        }}
                                    >
                                        <Feather
                                            name={item.icon as any}
                                            size={18}
                                            color={!isAllowed ? colors.textDisabled : itemColor}
                                        />
                                        <Typography
                                            variant={isActive ? "bodyEmphasized" : "body"}
                                            style={[styles.menuLabel, { color: !isAllowed ? colors.textDisabled : itemColor }]}
                                        >
                                            {item.label}
                                        </Typography>
                                        {!isAllowed && (
                                            <Feather
                                                name="lock"
                                                size={14}
                                                color={colors.textDisabled}
                                                style={styles.lockIcon}
                                            />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ))}
                </View>
            </DrawerContentScrollView>

            {/* Footer Drawer */}
            <View style={[styles.footer, { padding: metrics.spacing.lg, borderTopColor: colors.border }]}>
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Feather
                        name="log-out"
                        size={20}
                        color={colors.danger}
                    />
                    <Typography variant="bodyEmphasized" color={colors.danger} style={{ marginLeft: 12 }}>
                        Đăng xuất
                    </Typography>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: 64,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
    },
    logoBox: {
        padding: 6,
        borderRadius: 8,
        marginRight: 10,
    },
    userCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    avatarCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1.5,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    roleBadge: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 999,
        borderWidth: 1,
        alignSelf: "flex-start",
        marginTop: 4,
    },
    menuContainer: {},
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 4,
    },
    menuLabel: {
        marginLeft: 12,
    },
    lockIcon: {
        marginLeft: "auto",
    },
    sectionHeader: {
        letterSpacing: 0.8,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    footer: {
        borderTopWidth: 1,
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
    },
});
