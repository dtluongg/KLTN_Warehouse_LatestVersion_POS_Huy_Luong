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
import { useAuthStore } from "../store/authStore";
import { theme } from "../utils/theme";
import { ScreenHeader } from "../components/ui";

const HomeScreen = () => {
    const { username, role, logout } = useAuthStore();
    const navigation = useNavigation<any>();

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
        {
            label: "Nhập hàng",
            route: "GoodsReceipt",
            icon: "download" as const,
        },
    ];

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Tổng quan"
                subtitle="Hệ thống bán hàng và quản lý kho"
            />

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.heroCard}>
                    <View style={styles.heroLeft}>
                        <Text style={styles.heroTitle}>
                            Xin chào, {username || "Nhan vien"}
                        </Text>
                        <Text style={styles.heroSubtitle}>
                            Vai trò: {roleLabel}
                        </Text>
                    </View>
                    <View style={styles.avatarBox}>
                        <Text style={styles.avatarText}>
                            {(username || "?").charAt(0).toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Tac vu nhanh</Text>
                    <Text style={styles.sectionHint}>
                        Uu tien thao tac thuong dung
                    </Text>
                </View>

                <View style={styles.actionGrid}>
                    {quickActions.map((item) => (
                        <TouchableOpacity
                            key={item.route}
                            style={styles.actionCard}
                            onPress={() => navigation.navigate(item.route)}
                        >
                            <View style={styles.actionIconBox}>
                                <Feather
                                    name={item.icon}
                                    size={18}
                                    color={theme.colors.primary}
                                />
                            </View>
                            <Text style={styles.actionLabel}>{item.label}</Text>
                            <Feather
                                name="chevron-right"
                                size={16}
                                color={theme.colors.mutedForeground}
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Feather
                        name="log-out"
                        size={18}
                        color={theme.colors.error}
                    />
                    <Text style={styles.logoutText}>Đăng xuất</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        padding: theme.spacing.md,
        gap: theme.spacing.md,
        paddingBottom: theme.spacing.xl,
    },
    heroCard: {
        borderRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.md,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    heroLeft: {
        flex: 1,
        paddingRight: theme.spacing.sm,
    },
    heroTitle: {
        ...theme.typography.title,
        color: theme.colors.primaryForeground,
    },
    heroSubtitle: {
        ...theme.typography.caption,
        color: "rgba(255,255,255,0.85)",
        marginTop: 4,
    },
    avatarBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.2)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.35)",
    },
    avatarText: {
        color: theme.colors.primaryForeground,
        fontSize: 18,
        fontWeight: "700",
    },
    sectionHeader: {
        gap: 2,
        marginTop: 4,
    },
    sectionTitle: {
        ...theme.typography.label,
        color: theme.colors.foreground,
    },
    sectionHint: {
        ...theme.typography.caption,
        color: theme.colors.mutedForeground,
    },
    actionGrid: {
        gap: 10,
    },
    actionCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    actionIconBox: {
        width: 30,
        height: 30,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.primaryLight,
    },
    actionLabel: {
        flex: 1,
        ...theme.typography.body,
        color: theme.colors.foreground,
    },
    logoutButton: {
        marginTop: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderWidth: 1,
        borderColor: "#fecaca",
        borderRadius: theme.borderRadius.md,
        paddingVertical: 11,
        backgroundColor: "#fef2f2",
    },
    logoutText: {
        color: theme.colors.error,
        fontSize: 14,
        fontWeight: "700",
    },
});

export default HomeScreen;
