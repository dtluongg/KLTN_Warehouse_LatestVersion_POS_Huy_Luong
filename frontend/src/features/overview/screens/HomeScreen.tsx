import React from "react";
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    useWindowDimensions
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../../store/authStore";
import { useTheme } from "../../../hooks/useTheme";
import { Typography } from "../../../components/ui/Typography";
import { Card } from "../../../components/ui/Card";
import ScreenHeader from "../../../components/ui/ScreenHeader";

const HomeScreen = () => {
    const { username, role, logout } = useAuthStore();
    const navigation = useNavigation<any>();
    const { width } = useWindowDimensions();
    const { colors, metrics } = useTheme();

    const isLargeScreen = width > 768; // Desktop / Tablet breakpoint

    const roleLabel =
        role === "ADMIN"
            ? "Quản trị viên"
            : role === "SALES_STAFF"
              ? "Nhân viên bán hàng"
              : "Nhân viên kho";

    const quickActions = [
        { label: "Bán hàng POS", route: "Pos", icon: "shopping-bag" as const },
        { label: "Đơn hàng", route: "Orders", icon: "file-text" as const },
        { label: "Tồn kho", route: "InventoryStock", icon: "archive" as const },
        { label: "Thống kê kho", route: "WarehouseStatistics", icon: "bar-chart-2" as const },
        { label: "Nhập hàng", route: "GoodsReceipt", icon: "download" as const },
        { label: "AI Chat SQL", route: "AiSqlChat", icon: "message-circle" as const },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScreenHeader
                title="Tổng quan"
                subtitle="Hệ thống bán hàng và quản lý kho"
            />

            <ScrollView contentContainerStyle={styles.content}>
                <Card elevated style={{ ...styles.heroCard, backgroundColor: colors.primary }}>
                    <View style={styles.heroLeft}>
                        <Typography variant="heading2" color={colors.buttonText}>
                            Xin chào, {username || "Nhân viên"}
                        </Typography>
                        <Typography variant="caption" color="rgba(255,255,255,0.85)" style={{ marginTop: 4 }}>
                            Vai trò: {roleLabel}
                        </Typography>
                    </View>
                    <View style={[styles.avatarBox, { borderRadius: metrics.borderRadius.circle }]}>
                        <Typography variant="titleBox" color={colors.buttonText}>
                            {(username || "?").charAt(0).toUpperCase()}
                        </Typography>
                    </View>
                </Card>

                <View style={styles.sectionHeader}>
                    <Typography variant="bodyEmphasized" color={colors.textPrimary}>Tác vụ nhanh</Typography>
                    <Typography variant="caption" color={colors.textSecondary}>Ưu tiên thao tác thường dùng</Typography>
                </View>

                {/* Grid for Quick Actions: row on large screens, stack on mobile */}
                <View style={[styles.actionGrid, isLargeScreen && styles.actionGridLarge]}>
                    {quickActions.map((item) => (
                        <TouchableOpacity
                            key={item.route}
                            style={[
                                styles.actionCard,
                                { 
                                    backgroundColor: colors.surface, 
                                    borderColor: colors.border,
                                    borderRadius: metrics.borderRadius.medium
                                },
                                isLargeScreen && styles.actionCardLarge
                            ]}
                            onPress={() => navigation.navigate(item.route)}
                        >
                            <View style={[styles.actionIconBox, { backgroundColor: 'rgba(0,113,227,0.1)' }]}>
                                <Feather
                                    name={item.icon}
                                    size={18}
                                    color={colors.primary}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Typography variant="body" color={colors.textPrimary}>{item.label}</Typography>
                            </View>
                            <Feather
                                name="chevron-right"
                                size={16}
                                color={colors.textDisabled}
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Dọn rác logout cũ bằng UI chuẩn nhưng giữ màu danger theo hệ thống */}
                <TouchableOpacity 
                    style={[
                        styles.logoutButton, 
                        { 
                            borderColor: 'rgba(255, 59, 48, 0.3)', 
                            backgroundColor: 'rgba(255, 59, 48, 0.05)',
                            borderRadius: metrics.borderRadius.small
                        }
                    ]} 
                    onPress={logout}
                >
                    <Feather
                        name="log-out"
                        size={18}
                        color={colors.danger}
                    />
                    <Typography variant="bodyEmphasized" color={colors.danger}>Đăng xuất</Typography>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
        gap: 16,
        paddingBottom: 32,
    },
    heroCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 0, 
    },
    heroLeft: {
        flex: 1,
        paddingRight: 8,
    },
    avatarBox: {
        width: 46,
        height: 46,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.2)",
    },
    sectionHeader: {
        gap: 2,
        marginTop: 4,
    },
    actionGrid: {
        gap: 10,
        flexDirection: 'column',
    },
    actionGridLarge: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    actionCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 12,
        paddingVertical: 14,
        borderWidth: 1,
    },
    actionCardLarge: {
        width: '32%', // 3 columns on Desktop
        marginRight: '1.3%', // Spacing
    },
    actionIconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    logoutButton: {
        marginTop: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderWidth: 1,
        paddingVertical: 12,
    },
});

export default HomeScreen;
