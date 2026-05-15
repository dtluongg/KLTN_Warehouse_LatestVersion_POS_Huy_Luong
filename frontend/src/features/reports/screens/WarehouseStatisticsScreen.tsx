import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import ScreenHeader from "../../../components/ui/ScreenHeader";
import { Card } from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import { Typography } from "../../../components/ui/Typography";
import { useTheme } from "../../../hooks/useTheme";
import {
    DaysOfCoverageRow,
    InventoryDetailRow,
    InventoryValueRow,
    reportApi,
    SlowMovingRow,
    StockoutRiskRow,
} from "../../../api/reportApi";
import { axiosClient } from "../../../api/axiosClient";

type Warehouse = {
    id: number;
    code?: string;
    name: string;
    isActive: boolean;
};

type ReportKey =
    | "inventory-value"
    | "days-coverage"
    | "stockout-risk"
    | "slow-moving"
    | "inventory-detail";

const REPORT_TABS: Array<{ key: ReportKey; label: string; icon: React.ComponentProps<typeof Feather>["name"] }> = [
    { key: "inventory-value", label: "Giá trị tồn", icon: "dollar-sign" },
    { key: "days-coverage", label: "Ngày đủ hàng", icon: "calendar" },
    { key: "stockout-risk", label: "Rủi ro hết", icon: "alert-triangle" },
    { key: "slow-moving", label: "Chậm luân chuyển", icon: "clock" },
    { key: "inventory-detail", label: "Chi tiết tồn", icon: "layers" },
];

const ANALYSIS_PRESETS = [15, 30, 60, 90];
const INACTIVE_PRESETS = [30, 60, 90, 120];

const toISODate = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const formatCurrency = (value: number | null | undefined) => {
    const safe = Number(value || 0);
    return safe.toLocaleString("vi-VN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
};

const formatNumber = (value: number | null | undefined, digits = 2) => {
    const safe = Number(value || 0);
    return safe.toLocaleString("vi-VN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: digits,
    });
};

const getPriorityColor = (priority: string, palette: any) => {
    if (priority === "CRITICAL") return palette.danger;
    if (priority === "HIGH" || priority === "WARNING") return "#f59e0b";
    if (priority === "MEDIUM" || priority === "SLOW_MOVING") return "#0ea5e9";
    return "#10b981";
};

const WarehouseStatisticsScreen = () => {
    const { colors, metrics } = useTheme();

    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);

    const [analysisDays, setAnalysisDays] = useState(15);
    const [inactiveDays, setInactiveDays] = useState(30);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [selectedReport, setSelectedReport] = useState<ReportKey>("inventory-value");

    const [inventoryValue, setInventoryValue] = useState<InventoryValueRow[]>([]);
    const [daysCoverage, setDaysCoverage] = useState<DaysOfCoverageRow[]>([]);
    const [stockoutRisk, setStockoutRisk] = useState<StockoutRiskRow[]>([]);
    const [slowMoving, setSlowMoving] = useState<SlowMovingRow[]>([]);
    const [inventoryDetail, setInventoryDetail] = useState<InventoryDetailRow[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const loadWarehouses = useCallback(async () => {
        const res = await axiosClient.get("/warehouses");
        const list: Warehouse[] = Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data?.content)
              ? res.data.content
              : [];

        const active = list.filter((w) => w.isActive !== false);
        setWarehouses(active);

        if (!selectedWarehouseId && active.length > 0) {
            setSelectedWarehouseId(active[0].id);
            return active[0].id;
        }

        if (selectedWarehouseId && !active.some((w) => w.id === selectedWarehouseId) && active.length > 0) {
            setSelectedWarehouseId(active[0].id);
            return active[0].id;
        }

        return selectedWarehouseId;
    }, [selectedWarehouseId]);

    const loadReports = useCallback(
        async (warehouseId: number) => {
            const [valueRows, coverageRows, stockoutRows, slowRows, detailRows] = await Promise.all([
                reportApi.getInventoryValue(warehouseId),
                reportApi.getDaysOfCoverage(warehouseId, analysisDays),
                reportApi.getStockoutRisk(warehouseId, analysisDays),
                reportApi.getSlowMovingProducts(warehouseId, inactiveDays),
                reportApi.getInventoryDetail(warehouseId),
            ]);

            setInventoryValue(valueRows);
            setDaysCoverage(coverageRows);
            setStockoutRisk(stockoutRows);
            setSlowMoving(slowRows);
            setInventoryDetail(detailRows);
        },
        [analysisDays, inactiveDays],
    );

    const fetchAll = useCallback(
        async (isRefreshing = false) => {
            try {
                if (!isRefreshing) {
                    setLoading(true);
                }
                setErrorMessage(null);

                const warehouseId = (await loadWarehouses()) || selectedWarehouseId;
                if (!warehouseId) {
                    setInventoryValue([]);
                    setDaysCoverage([]);
                    setStockoutRisk([]);
                    setSlowMoving([]);
                    setInventoryDetail([]);
                    return;
                }

                await loadReports(warehouseId);
            } catch (error) {
                console.error("Failed to load warehouse statistics", error);
                setErrorMessage("Không tải được dữ liệu thống kê. Vui lòng thử lại.");
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [loadWarehouses, loadReports, selectedWarehouseId],
    );

    useFocusEffect(
        useCallback(() => {
            fetchAll();
        }, [fetchAll]),
    );

    useEffect(() => {
        if (selectedWarehouseId) {
            loadReports(selectedWarehouseId);
        }
    }, [selectedWarehouseId, loadReports]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchAll(true);
    };

    const activeWarehouseName = useMemo(() => {
        return warehouses.find((w) => w.id === selectedWarehouseId)?.name || "Chưa chọn kho";
    }, [warehouses, selectedWarehouseId]);

    const summary = useMemo(() => {
        const totalInventoryValue = inventoryValue.reduce((sum, row) => sum + Number(row.totalValue || 0), 0);
        const criticalStockout = stockoutRisk.filter((row) => row.priority === "CRITICAL").length;
        const warningCoverage = daysCoverage.filter((row) => row.riskLevel === "CRITICAL" || row.riskLevel === "WARNING").length;
        const deadStockValue = slowMoving
            .filter((row) => row.riskCategory === "DEAD_STOCK")
            .reduce((sum, row) => sum + Number(row.inventoryValue || 0), 0);

        return {
            totalInventoryValue,
            criticalStockout,
            warningCoverage,
            deadStockValue,
        };
    }, [daysCoverage, inventoryValue, slowMoving, stockoutRisk]);

    const renderReportContent = () => {
        if (selectedReport === "inventory-value") {
            const top = inventoryValue.slice(0, 20);
            if (top.length === 0) return <EmptyState title="Không có dữ liệu giá trị tồn kho" />;
            return top.map((row) => (
                <Card key={`${row.productId}-${row.warehouseId}`} style={styles.listCard}>
                    <View style={styles.listHeaderRow}>
                        <Typography variant="bodyEmphasized" color={colors.textPrimary}>
                            {row.productName}
                        </Typography>
                        <Typography variant="bodyEmphasized" color={colors.primary}>
                            {formatCurrency(row.totalValue)} đ
                        </Typography>
                    </View>
                    <Typography variant="caption" color={colors.textSecondary}>
                        SKU: {row.sku} | Tồn: {formatNumber(row.onHand, 0)} | Giá vốn: {formatCurrency(row.avgCost)} đ
                    </Typography>
                </Card>
            ));
        }

        if (selectedReport === "days-coverage") {
            const top = daysCoverage.slice(0, 20);
            if (top.length === 0) return <EmptyState title="Không có dữ liệu số ngày đủ hàng" />;
            return top.map((row) => (
                <Card key={`${row.productId}-${row.warehouseId}`} style={styles.listCard}>
                    <View style={styles.listHeaderRow}>
                        <Typography variant="bodyEmphasized" color={colors.textPrimary}>
                            {row.productName}
                        </Typography>
                        <Typography
                            variant="captionBold"
                            style={{ color: getPriorityColor(row.riskLevel, colors) }}
                        >
                            {row.riskLevel}
                        </Typography>
                    </View>
                    <Typography variant="caption" color={colors.textSecondary}>
                        Nhu cầu/ngày: {formatNumber(row.avgDailyDemand)} | Tồn: {formatNumber(row.onHand, 0)} | Đủ: {formatNumber(row.daysOfCoverage, 1)} ngày
                    </Typography>
                </Card>
            ));
        }

        if (selectedReport === "stockout-risk") {
            const top = stockoutRisk.slice(0, 20);
            if (top.length === 0) return <EmptyState title="Không có cảnh báo hết hàng" />;
            return top.map((row) => (
                <Card key={`${row.productId}-${row.warehouseId}`} style={styles.listCard}>
                    <View style={styles.listHeaderRow}>
                        <Typography variant="bodyEmphasized" color={colors.textPrimary}>
                            {row.productName}
                        </Typography>
                        <Typography
                            variant="captionBold"
                            style={{ color: getPriorityColor(row.priority, colors) }}
                        >
                            {row.priority}
                        </Typography>
                    </View>
                    <Typography variant="caption" color={colors.textSecondary}>
                        Còn: {formatNumber(row.onHand, 0)} | Hết sau: {formatNumber(row.daysUntilStockout, 1)} ngày
                        {row.estimatedStockoutDate ? ` | Dự kiến hết: ${row.estimatedStockoutDate}` : ""}
                    </Typography>
                </Card>
            ));
        }

        if (selectedReport === "slow-moving") {
            const top = slowMoving.slice(0, 20);
            if (top.length === 0) return <EmptyState title="Không có hàng chậm luân chuyển" />;
            return top.map((row) => (
                <Card key={`${row.productId}-${row.warehouseId}`} style={styles.listCard}>
                    <View style={styles.listHeaderRow}>
                        <Typography variant="bodyEmphasized" color={colors.textPrimary}>
                            {row.productName}
                        </Typography>
                        <Typography
                            variant="captionBold"
                            style={{ color: getPriorityColor(row.riskCategory, colors) }}
                        >
                            {row.riskCategory}
                        </Typography>
                    </View>
                    <Typography variant="caption" color={colors.textSecondary}>
                        Không bán: {formatNumber(row.daysSinceLastMovement, 0)} ngày | Tồn: {formatNumber(row.onHand, 0)} | Giá trị: {formatCurrency(row.inventoryValue)} đ
                    </Typography>
                </Card>
            ));
        }

        if (selectedReport === "inventory-detail") {
            const top = inventoryDetail.slice(0, 30);
            if (top.length === 0) return <EmptyState title="Không có dữ liệu tồn kho chi tiết" />;
            return top.map((row) => (
                <Card key={`${row.productId}-${row.warehouseId}`} style={styles.listCard}>
                    <View style={styles.listHeaderRow}>
                        <Typography variant="bodyEmphasized" color={colors.textPrimary}>
                            {row.productName}
                        </Typography>
                        <Typography
                            variant="captionBold"
                            style={{ color: getPriorityColor(row.status, colors) }}
                        >
                            {row.status}
                        </Typography>
                    </View>
                    <Typography variant="caption" color={colors.textSecondary}>
                        Tồn: {formatNumber(row.onHand, 0)} | Giá trị: {formatCurrency(row.totalValue)} đ | Bán: {formatCurrency(row.salePrice)} đ
                    </Typography>
                </Card>
            ));
        }

        return null;
    };

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Typography variant="body" color={colors.textSecondary} style={{ marginTop: 10 }}>
                    Đang tải dashboard thống kê kho...
                </Typography>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Toolbar compact — action buttons căn phải */}
            <View style={[styles.toolbar, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                    style={[styles.refreshButton, { borderRadius: metrics.borderRadius.pill, borderColor: colors.border, backgroundColor: colors.background }]}
                    onPress={() => setShowAdvanced((prev) => !prev)}
                >
                    <Feather name={showAdvanced ? "chevron-up" : "sliders"} size={14} color={colors.primary} />
                    <Typography variant="captionBold" color={colors.primary}>Nâng cao</Typography>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.refreshButton, { borderRadius: metrics.borderRadius.pill, borderColor: colors.border, backgroundColor: colors.background }]}
                    onPress={() => fetchAll()}
                >
                    <Feather name="refresh-cw" size={14} color={colors.primary} />
                    <Typography variant="captionBold" color={colors.primary}>Làm mới</Typography>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            >
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsWrap}>
                    {warehouses.map((warehouse) => {
                        const active = warehouse.id === selectedWarehouseId;
                        return (
                            <TouchableOpacity
                                key={warehouse.id}
                                style={[
                                    styles.pill,
                                    {
                                        borderColor: active ? colors.primary : colors.border,
                                        backgroundColor: active ? "rgba(0,113,227,0.1)" : colors.surface,
                                        borderRadius: metrics.borderRadius.pill,
                                    },
                                ]}
                                onPress={() => setSelectedWarehouseId(warehouse.id)}
                            >
                                <Typography variant="captionBold" color={active ? colors.primary : colors.textPrimary}>
                                    {warehouse.name}
                                </Typography>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <View style={styles.metricsGrid}>
                    <Card style={styles.metricCard} elevated>
                        <Typography variant="caption" color={colors.textSecondary}>Tổng giá trị tồn</Typography>
                        <Typography variant="heading2" color={colors.textPrimary}>{formatCurrency(summary.totalInventoryValue)} đ</Typography>
                    </Card>
                    <Card style={styles.metricCard} elevated>
                        <Typography variant="caption" color={colors.textSecondary}>Rủi ro hết hàng (Critical)</Typography>
                        <Typography variant="heading2" color={colors.danger}>{summary.criticalStockout}</Typography>
                    </Card>
                    <Card style={styles.metricCard} elevated>
                        <Typography variant="caption" color={colors.textSecondary}>SKU dưới ngưỡng an toàn</Typography>
                        <Typography variant="heading2" color={colors.textPrimary}>{summary.warningCoverage}</Typography>
                    </Card>
                    <Card style={styles.metricCard} elevated>
                        <Typography variant="caption" color={colors.textSecondary}>Giá trị hàng không bán được</Typography>
                        <Typography variant="heading2" color={colors.textPrimary}>{formatCurrency(summary.deadStockValue)} đ</Typography>
                    </Card>
                </View>

                {showAdvanced ? (
                    <Card style={styles.controlCard}>
                        <Typography variant="bodyEmphasized" color={colors.textPrimary}>Bộ tham số phân tích (MVP)</Typography>

                        <View style={styles.controlGroup}>
                            <Typography variant="caption" color={colors.textSecondary}>Kỳ nhu cầu (ngày)</Typography>
                            <View style={styles.inlinePills}>
                                {ANALYSIS_PRESETS.map((day) => {
                                    const active = analysisDays === day;
                                    return (
                                        <TouchableOpacity
                                            key={day}
                                            style={[
                                                styles.pill,
                                                {
                                                    borderColor: active ? colors.primary : colors.border,
                                                    backgroundColor: active ? "rgba(0,113,227,0.1)" : "transparent",
                                                    borderRadius: metrics.borderRadius.pill,
                                                },
                                            ]}
                                            onPress={() => setAnalysisDays(day)}
                                        >
                                            <Typography variant="captionBold" color={active ? colors.primary : colors.textPrimary}>{day}</Typography>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        <View style={styles.controlGroup}>
                            <Typography variant="caption" color={colors.textSecondary}>Không bán trong (ngày)</Typography>
                            <View style={styles.inlinePills}>
                                {INACTIVE_PRESETS.map((day) => {
                                    const active = inactiveDays === day;
                                    return (
                                        <TouchableOpacity
                                            key={day}
                                            style={[
                                                styles.pill,
                                                {
                                                    borderColor: active ? colors.primary : colors.border,
                                                    backgroundColor: active ? "rgba(0,113,227,0.1)" : "transparent",
                                                    borderRadius: metrics.borderRadius.pill,
                                                },
                                            ]}
                                            onPress={() => setInactiveDays(day)}
                                        >
                                            <Typography variant="captionBold" color={active ? colors.primary : colors.textPrimary}>{day}</Typography>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.applyButton,
                                {
                                    borderRadius: metrics.borderRadius.pill,
                                    backgroundColor: colors.primary,
                                },
                            ]}
                            onPress={() => selectedWarehouseId && loadReports(selectedWarehouseId)}
                        >
                            <Feather name="bar-chart-2" size={14} color={colors.buttonText} />
                            <Typography variant="captionBold" color={colors.buttonText}>Áp dụng bộ lọc</Typography>
                        </TouchableOpacity>
                    </Card>
                ) : null}

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsWrap}>
                    {REPORT_TABS.map((tab) => {
                        const active = selectedReport === tab.key;
                        return (
                            <TouchableOpacity
                                key={tab.key}
                                style={[
                                    styles.pill,
                                    {
                                        flexDirection: "row",
                                        gap: 8,
                                        alignItems: "center",
                                        borderColor: active ? colors.primary : colors.border,
                                        backgroundColor: active ? "rgba(0,113,227,0.1)" : colors.surface,
                                        borderRadius: metrics.borderRadius.pill,
                                    },
                                ]}
                                onPress={() => setSelectedReport(tab.key)}
                            >
                                <Feather name={tab.icon} size={14} color={active ? colors.primary : colors.textSecondary} />
                                <Typography variant="captionBold" color={active ? colors.primary : colors.textPrimary}>
                                    {tab.label}
                                </Typography>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {errorMessage ? (
                    <Card style={{ borderLeftWidth: 3, borderLeftColor: colors.danger }}>
                        <Typography variant="body" color={colors.danger}>{errorMessage}</Typography>
                    </Card>
                ) : null}

                <View style={styles.listWrap}>{renderReportContent()}</View>
            </ScrollView>
        </View>
    );
};

export default WarehouseStatisticsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    toolbar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        padding: 10,
        borderBottomWidth: 1,
    },
    scroll: {
        flex: 1,
    },
    content: {
        padding: 16,
        gap: 12,
        paddingBottom: 40,
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    refreshButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderWidth: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    pillsWrap: {
        gap: 8,
    },
    pill: {
        borderWidth: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    metricsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    metricCard: {
        minWidth: 180,
        flex: 1,
        gap: 6,
    },
    controlCard: {
        gap: 12,
    },
    controlGroup: {
        gap: 6,
    },
    inlinePills: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    applyButton: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    listWrap: {
        gap: 8,
    },
    listCard: {
        gap: 6,
    },
    listHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
    },
});
