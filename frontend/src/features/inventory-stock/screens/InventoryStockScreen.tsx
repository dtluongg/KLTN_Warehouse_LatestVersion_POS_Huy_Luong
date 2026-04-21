import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

import { axiosClient } from "../../../api/axiosClient";
import { EmptyState, ScreenHeader, SearchBar } from "../../../components/ui";
import { useResponsive } from "../../../utils/responsive";
import { theme } from "../../../utils/theme";

type Warehouse = {
    id: number;
    code: string;
    name: string;
    isActive: boolean;
};

type ProductStock = {
    id: number;
    sku: string;
    barcode?: string;
    name: string;
    onHand: number;
};

type WarehouseBreakdown = {
    warehouseId: number;
    warehouseName: string;
    onHand: number;
};

type InventoryRow = ProductStock & {
    breakdown: WarehouseBreakdown[];
};

type SelectedWarehouse = "SYSTEM" | number;

const InventoryStockScreen = () => {
    const { isDesktop } = useResponsive();

    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [stocksByWarehouse, setStocksByWarehouse] = useState<
        Record<number, ProductStock[]>
    >({});

    const [selectedWarehouse, setSelectedWarehouse] =
        useState<SelectedWarehouse>("SYSTEM");
    const [showWarehouseModal, setShowWarehouseModal] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setErrorMessage(null);
            const warehouseRes = await axiosClient.get("/warehouses");
            const activeWarehouses: Warehouse[] = (
                warehouseRes.data.content || warehouseRes.data || []
            ).filter((w: Warehouse) => w.isActive);
            setWarehouses(activeWarehouses);

            if (activeWarehouses.length === 0) {
                setStocksByWarehouse({});
                return;
            }

            const stockResponses = await Promise.all(
                activeWarehouses.map((warehouse) =>
                    axiosClient.get(
                        `/products/stock-by-warehouse?warehouseId=${warehouse.id}`,
                    ),
                ),
            );

            const nextStocks: Record<number, ProductStock[]> = {};
            activeWarehouses.forEach((warehouse, index) => {
                nextStocks[warehouse.id] = stockResponses[index].data || [];
            });

            setStocksByWarehouse(nextStocks);
        } catch (error) {
            console.log("Lỗi tải tồn kho:", error);
            setErrorMessage("Không thể tải dữ liệu tồn kho. Vui lòng thử lại.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData]),
    );

    const inventoryRows: InventoryRow[] = useMemo(() => {
        if (selectedWarehouse === "SYSTEM") {
            const merged = new Map<number, InventoryRow>();

            warehouses.forEach((warehouse) => {
                const rows = stocksByWarehouse[warehouse.id] || [];
                rows.forEach((row) => {
                    const current = merged.get(row.id);
                    if (!current) {
                        merged.set(row.id, {
                            ...row,
                            onHand: row.onHand || 0,
                            breakdown: [
                                {
                                    warehouseId: warehouse.id,
                                    warehouseName: warehouse.name,
                                    onHand: row.onHand || 0,
                                },
                            ],
                        });
                    } else {
                        current.onHand += row.onHand || 0;
                        current.breakdown.push({
                            warehouseId: warehouse.id,
                            warehouseName: warehouse.name,
                            onHand: row.onHand || 0,
                        });
                    }
                });
            });

            return Array.from(merged.values());
        }

        const currentRows = stocksByWarehouse[selectedWarehouse] || [];
        const warehouseName =
            warehouses.find((w) => w.id === selectedWarehouse)?.name || "Kho";

        return currentRows.map((row) => ({
            ...row,
            breakdown: [
                {
                    warehouseId: selectedWarehouse,
                    warehouseName,
                    onHand: row.onHand || 0,
                },
            ],
        }));
    }, [selectedWarehouse, stocksByWarehouse, warehouses]);

    const filteredRows = useMemo(() => {
        const sortedRows = [...inventoryRows].sort((a, b) =>
            a.name.localeCompare(b.name),
        );
        if (!searchKeyword.trim()) {
            return sortedRows;
        }

        const keyword = searchKeyword.toLowerCase();
        return sortedRows.filter((row) => {
            return (
                (row.name || "").toLowerCase().includes(keyword) ||
                (row.sku || "").toLowerCase().includes(keyword) ||
                (row.barcode || "").toLowerCase().includes(keyword)
            );
        });
    }, [inventoryRows, searchKeyword]);

    const selectedWarehouseLabel =
        selectedWarehouse === "SYSTEM"
            ? "Toàn hệ thống"
            : warehouses.find((w) => w.id === selectedWarehouse)?.name ||
              "Chọn kho";

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const renderWarehouseModal = () => (
        <Modal
            visible={showWarehouseModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowWarehouseModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalBox}>
                    <View style={styles.modalHeader}>
                        <MaterialCommunityIcons
                            name="warehouse"
                            size={22}
                            color={theme.colors.primary}
                        />
                        <Text style={styles.modalTitle}>Chọn kho hiển thị</Text>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.warehouseItem,
                            selectedWarehouse === "SYSTEM" &&
                                styles.warehouseItemActive,
                        ]}
                        onPress={() => {
                            setSelectedWarehouse("SYSTEM");
                            setShowWarehouseModal(false);
                        }}
                    >
                        <View style={styles.warehouseItemTextBox}>
                            <Text
                                style={[
                                    styles.warehouseItemName,
                                    selectedWarehouse === "SYSTEM" &&
                                        styles.warehouseItemNameActive,
                                ]}
                            >
                                Toàn hệ thống
                            </Text>
                            <Text style={styles.warehouseItemAddress}>
                                Gộp tồn kho từ tất cả kho
                            </Text>
                        </View>
                        {selectedWarehouse === "SYSTEM" && (
                            <Feather
                                name="check-circle"
                                size={20}
                                color={theme.colors.primary}
                            />
                        )}
                    </TouchableOpacity>

                    {warehouses.map((warehouse) => {
                        const isActive = selectedWarehouse === warehouse.id;
                        return (
                            <TouchableOpacity
                                key={warehouse.id}
                                style={[
                                    styles.warehouseItem,
                                    isActive && styles.warehouseItemActive,
                                ]}
                                onPress={() => {
                                    setSelectedWarehouse(warehouse.id);
                                    setShowWarehouseModal(false);
                                }}
                            >
                                <View style={styles.warehouseItemTextBox}>
                                    <Text
                                        style={[
                                            styles.warehouseItemName,
                                            isActive &&
                                                styles.warehouseItemNameActive,
                                        ]}
                                    >
                                        {warehouse.name}
                                    </Text>
                                    {warehouse.code ? (
                                        <Text
                                            style={styles.warehouseItemAddress}
                                        >
                                            Mã kho: {warehouse.code}
                                        </Text>
                                    ) : null}
                                </View>
                                {isActive && (
                                    <Feather
                                        name="check-circle"
                                        size={20}
                                        color={theme.colors.primary}
                                    />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </Modal>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Đang tải tồn kho...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Tồn kho"
                subtitle={`${filteredRows.length} sản phẩm`}
            />

            <View style={styles.searchArea}>
                <SearchBar
                    value={searchKeyword}
                    onChangeText={setSearchKeyword}
                    placeholder="Tìm theo tên, SKU, mã vạch..."
                />
            </View>

            <TouchableOpacity
                style={styles.warehouseBanner}
                onPress={() => setShowWarehouseModal(true)}
            >
                <MaterialCommunityIcons
                    name="warehouse"
                    size={16}
                    color={theme.colors.primary}
                />
                <Text style={styles.warehouseBannerText} numberOfLines={1}>
                    {selectedWarehouseLabel}
                </Text>
                <Feather
                    name="chevron-down"
                    size={14}
                    color={theme.colors.mutedForeground}
                />
            </TouchableOpacity>

            {errorMessage ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={fetchData}
                    >
                        <Text style={styles.retryButtonText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            <FlatList
                data={filteredRows}
                numColumns={isDesktop ? 2 : 1}
                key={isDesktop ? "inventory-desktop" : "inventory-mobile"}
                keyExtractor={(item) => String(item.id)}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[theme.colors.primary]}
                    />
                }
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={
                    isDesktop ? styles.desktopColumn : undefined
                }
                renderItem={({ item }) => {
                    return (
                        <View
                            style={[
                                styles.itemCard,
                                isDesktop && styles.itemCardDesktop,
                            ]}
                        >
                            <View style={styles.itemHeader}>
                                <View style={styles.itemTitleBox}>
                                    <Text style={styles.productName}>
                                        {item.name}
                                    </Text>
                                    <Text style={styles.productMeta}>
                                        SKU: {item.sku || "-"}
                                    </Text>
                                </View>
                                <View style={styles.quantityBadge}>
                                    <Text style={styles.quantityValue}>
                                        {item.onHand.toLocaleString("vi-VN")}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.breakdownText}>
                                {item.breakdown
                                    .map(
                                        (line) =>
                                            `${line.warehouseName}: ${line.onHand.toLocaleString("vi-VN")}`,
                                    )
                                    .join(" | ")}
                            </Text>
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <EmptyState
                        title="Không có dữ liệu tồn kho"
                        description="Thử đổi từ khóa tìm kiếm hoặc chọn kho khác."
                    />
                }
            />

            {renderWarehouseModal()}
        </View>
    );
};

export default InventoryStockScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
    loadingText: {
        color: theme.colors.mutedForeground,
        fontSize: 14,
    },
    searchArea: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.sm,
        paddingBottom: theme.spacing.sm,
    },
    warehouseBanner: {
        marginHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: "#86efac",
        backgroundColor: "#dcfce7",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    warehouseBannerText: {
        flex: 1,
        color: theme.colors.primary,
        fontSize: 13,
        fontWeight: "700",
    },
    errorBox: {
        marginHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        padding: theme.spacing.sm,
        borderWidth: 1,
        borderColor: "#fecaca",
        backgroundColor: "#fef2f2",
        borderRadius: theme.borderRadius.md,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    errorText: {
        flex: 1,
        color: "#991b1b",
        fontSize: 12,
    },
    retryButton: {
        backgroundColor: "#fee2e2",
        borderRadius: theme.borderRadius.sm,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    retryButtonText: {
        color: "#991b1b",
        fontSize: 12,
        fontWeight: "700",
    },
    listContent: {
        paddingHorizontal: theme.spacing.md,
        paddingBottom: theme.spacing.lg,
    },
    desktopColumn: {
        gap: 10,
    },
    itemCard: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.sm,
        marginBottom: 10,
    },
    itemCardDesktop: {
        flex: 1,
    },
    itemHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    itemTitleBox: {
        flex: 1,
    },
    productName: {
        color: theme.colors.textPrimary || theme.colors.foreground,
        fontSize: 14,
        fontWeight: "700",
    },
    productMeta: {
        marginTop: 2,
        color: theme.colors.mutedForeground,
        fontSize: 12,
    },
    quantityBadge: {
        minWidth: 84,
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: "#ecfdf5",
    },
    quantityValue: {
        color: "#065f46",
        fontSize: 16,
        fontWeight: "700",
    },
    breakdownText: {
        marginTop: 8,
        color: theme.colors.mutedForeground,
        fontSize: 12,
        lineHeight: 18,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: theme.colors.overlay,
        justifyContent: "center",
        paddingHorizontal: theme.spacing.md,
    },
    modalBox: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: theme.spacing.sm,
    },
    modalTitle: {
        color: theme.colors.textPrimary || theme.colors.foreground,
        fontSize: 18,
        fontWeight: "700",
    },
    warehouseItem: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginTop: 8,
        gap: 8,
    },
    warehouseItemActive: {
        borderColor: "#86efac",
        backgroundColor: "#f0fdf4",
    },
    warehouseItemTextBox: {
        flex: 1,
    },
    warehouseItemName: {
        color: theme.colors.textPrimary || theme.colors.foreground,
        fontSize: 14,
        fontWeight: "600",
    },
    warehouseItemNameActive: {
        color: theme.colors.primary,
    },
    warehouseItemAddress: {
        marginTop: 1,
        color: theme.colors.mutedForeground,
        fontSize: 12,
    },
});
