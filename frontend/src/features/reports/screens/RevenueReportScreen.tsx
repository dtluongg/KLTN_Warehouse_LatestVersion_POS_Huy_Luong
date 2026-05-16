import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../../../hooks/useTheme';
import ScreenHeader from '../../../components/ui/ScreenHeader';
import { Card } from '../../../components/ui/Card';
import { Typography } from '../../../components/ui/Typography';
import { reportApi, SalesSummaryRow } from '../../../api/reportApi';
import { axiosClient } from '../../../api/axiosClient';

type Warehouse = {
    id: number;
    name: string;
    isActive: boolean;
};

const formatCurrency = (value: number | undefined | null) => {
    const safe = Number(value || 0);
    return safe.toLocaleString('vi-VN');
};

const getStartOfDay = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

const getEndOfDay = (date: Date) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
};

const toLocalDateTimeString = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 19);
    return localISOTime; // "YYYY-MM-DDTHH:mm:ss"
};

const RevenueReportScreen = () => {
    const { colors, metrics } = useTheme();

    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);

    const [summaryData, setSummaryData] = useState<SalesSummaryRow | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Filter controls
    const [timeFilter, setTimeFilter] = useState<'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM'>('TODAY');
    
    // For custom dates (store the raw string from inputs)
    const [customFromDate, setCustomFromDate] = useState(() => {
        const d = new Date();
        return d.toISOString().split('T')[0];
    });
    const [customToDate, setCustomToDate] = useState(() => {
        const d = new Date();
        return d.toISOString().split('T')[0];
    });

    const loadWarehouses = useCallback(async () => {
        const res = await axiosClient.get('/warehouses');
        const list: Warehouse[] = Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data?.content)
                ? res.data.content
                : [];

        const active = list.filter((w) => w.isActive !== false);
        setWarehouses(active);

        // We don't auto-select the first warehouse here if we want "Tất cả kho" to work natively
        return selectedWarehouseId;
    }, [selectedWarehouseId]);

    const calculateDateRange = () => {
        const now = new Date();
        let fromDateStr = '';
        let toDateStr = '';

        if (timeFilter === 'TODAY') {
            fromDateStr = toLocalDateTimeString(getStartOfDay(now));
            toDateStr = toLocalDateTimeString(getEndOfDay(now));
        } else if (timeFilter === 'THIS_WEEK') {
            const startOfWeek = new Date(now);
            const day = startOfWeek.getDay() || 7; // Get current day number, converting Sun. to 7
            if (day !== 1) startOfWeek.setHours(-24 * (day - 1)); // Set to Monday
            fromDateStr = toLocalDateTimeString(getStartOfDay(startOfWeek));
            toDateStr = toLocalDateTimeString(getEndOfDay(now));
        } else if (timeFilter === 'THIS_MONTH') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            fromDateStr = toLocalDateTimeString(getStartOfDay(startOfMonth));
            toDateStr = toLocalDateTimeString(getEndOfDay(now));
        } else if (timeFilter === 'CUSTOM') {
            if (customFromDate && customToDate) {
                // Attach time for custom range (start of fromDate to end of toDate)
                fromDateStr = `${customFromDate}T00:00:00`;
                toDateStr = `${customToDate}T23:59:59`;
            }
        }
        return { fromDateStr, toDateStr };
    };

    const fetchSummary = useCallback(async (isRefreshing = false) => {
        try {
            if (!isRefreshing) setLoading(true);
            setErrorMessage(null);

            const warehouseId = await loadWarehouses();
            
            const { fromDateStr, toDateStr } = calculateDateRange();
            
            const data = await reportApi.getSalesSummary(
                warehouseId === null ? undefined : warehouseId, 
                fromDateStr, 
                toDateStr
            );
            setSummaryData(data);
        } catch (error: any) {
            setErrorMessage('Không tải được dữ liệu doanh thu.');
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [loadWarehouses, timeFilter, customFromDate, customToDate]);

    useFocusEffect(
        useCallback(() => {
            fetchSummary();
        }, [fetchSummary])
    );

    useEffect(() => {
        // Fetch whenever selectedWarehouseId changes
        fetchSummary();
    }, [selectedWarehouseId]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchSummary(true);
    };

    const activeWarehouseName = useMemo(() => {
        if (!selectedWarehouseId) return "Tất cả kho";
        return warehouses.find((w) => w.id === selectedWarehouseId)?.name || "—";
    }, [warehouses, selectedWarehouseId]);

    const renderFinancialCards = () => {
        if (!summaryData) return null;

        return (
            <View style={styles.cardsWrap}>
                <Card style={styles.cardBox} elevated>
                    <View style={[styles.iconWrap, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                        <Feather name="trending-up" size={24} color="#10b981" />
                    </View>
                    <Typography variant="caption" color={colors.textSecondary} style={styles.cardTitle}>DOANH THU THUẦN</Typography>
                    <Typography variant="heading1" style={{ color: '#10b981' }}>
                        {formatCurrency(summaryData.netRevenue)} đ
                    </Typography>
                </Card>

                <Card style={styles.cardBox} elevated>
                    <View style={[styles.iconWrap, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                        <Feather name="corner-up-left" size={24} color="#ef4444" />
                    </View>
                    <Typography variant="caption" color={colors.textSecondary} style={styles.cardTitle}>KHÁCH TRẢ HÀNG</Typography>
                    <Typography variant="heading1" style={{ color: '#ef4444' }}>
                        {formatCurrency(summaryData.totalReturns)} đ
                    </Typography>
                </Card>

                <Card style={styles.cardBox} elevated>
                    <View style={[styles.iconWrap, { backgroundColor: 'rgba(107,114,128,0.1)' }]}>
                        <Feather name="box" size={24} color="#6b7280" />
                    </View>
                    <Typography variant="caption" color={colors.textSecondary} style={styles.cardTitle}>GIÁ VỐN HÀNG BÁN</Typography>
                    <Typography variant="heading1" style={{ color: '#6b7280' }}>
                        {formatCurrency(summaryData.cogs)} đ
                    </Typography>
                </Card>

                <Card style={styles.cardBox} elevated>
                    <View style={[styles.iconWrap, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                        <Feather name="alert-triangle" size={24} color="#f59e0b" />
                    </View>
                    <Typography variant="caption" color={colors.textSecondary} style={styles.cardTitle}>HAO HỤT KIỂM KHO</Typography>
                    <Typography variant="heading1" style={{ color: '#f59e0b' }}>
                        {formatCurrency(summaryData.stockAdjustments)} đ
                    </Typography>
                </Card>

                <Card style={[styles.cardBox, { backgroundColor: 'rgba(14,165,233,0.05)', borderColor: 'rgba(14,165,233,0.2)' }]} elevated>
                    <View style={[styles.iconWrap, { backgroundColor: 'rgba(14,165,233,0.2)' }]}>
                        <Feather name="dollar-sign" size={24} color="#0ea5e9" />
                    </View>
                    <Typography variant="captionBold" style={{ color: '#0ea5e9', marginBottom: 4 }}>LỢI NHUẬN GỘP THỰC TẾ</Typography>
                    <Typography variant="hero" style={{ color: '#0284c7' }}>
                        {formatCurrency(summaryData.grossProfit)} đ
                    </Typography>
                    <Typography variant="micro" color={colors.textSecondary} style={{ marginTop: 4 }}>
                        = Doanh thu - Giá vốn - Trả hàng - Hao hụt
                    </Typography>
                </Card>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Toolbar compact — không có title thừa */}
            <View style={[styles.toolbar, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                    style={[styles.refreshButton, { borderRadius: metrics.borderRadius.pill, borderColor: colors.border, backgroundColor: colors.background }]}
                    onPress={() => fetchSummary()}
                >
                    <Feather name="refresh-cw" size={14} color={colors.primary} />
                    <Typography variant="captionBold" color={colors.primary}>Làm mới</Typography>
                </TouchableOpacity>
            </View>

            <ScrollView 
                style={styles.scroll} 
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Warehouse Selection */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsWrap}>
                    <TouchableOpacity
                        style={[
                            styles.pill,
                            {
                                borderColor: selectedWarehouseId === null ? colors.primary : colors.border,
                                backgroundColor: selectedWarehouseId === null ? "rgba(0,113,227,0.1)" : colors.surface,
                                borderRadius: metrics.borderRadius.pill,
                            },
                        ]}
                        onPress={() => setSelectedWarehouseId(null)}
                    >
                        <Typography variant="captionBold" color={selectedWarehouseId === null ? colors.primary : colors.textPrimary}>
                            Tất cả kho
                        </Typography>
                    </TouchableOpacity>
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

                {/* Time Filter */}
                <Card style={styles.filterCard}>
                    <View style={styles.filterRow}>
                        <TouchableOpacity
                            style={[styles.timeBtn, timeFilter === 'TODAY' && { backgroundColor: colors.primary }]}
                            onPress={() => setTimeFilter('TODAY')}
                        >
                            <Typography variant="captionBold" color={timeFilter === 'TODAY' ? colors.buttonText : colors.textPrimary}>Hôm nay</Typography>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.timeBtn, timeFilter === 'THIS_WEEK' && { backgroundColor: colors.primary }]}
                            onPress={() => setTimeFilter('THIS_WEEK')}
                        >
                            <Typography variant="captionBold" color={timeFilter === 'THIS_WEEK' ? colors.buttonText : colors.textPrimary}>Tuần này</Typography>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.timeBtn, timeFilter === 'THIS_MONTH' && { backgroundColor: colors.primary }]}
                            onPress={() => setTimeFilter('THIS_MONTH')}
                        >
                            <Typography variant="captionBold" color={timeFilter === 'THIS_MONTH' ? colors.buttonText : colors.textPrimary}>Tháng này</Typography>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.timeBtn, timeFilter === 'CUSTOM' && { backgroundColor: colors.primary }]}
                            onPress={() => setTimeFilter('CUSTOM')}
                        >
                            <Typography variant="captionBold" color={timeFilter === 'CUSTOM' ? colors.buttonText : colors.textPrimary}>Tùy chỉnh</Typography>
                        </TouchableOpacity>
                    </View>

                    {timeFilter === 'CUSTOM' && (
                        <View style={styles.customDateWrap}>
                            <View style={styles.dateInputGroup}>
                                <Typography variant="caption" color={colors.textSecondary}>Từ ngày:</Typography>
                                {Platform.OS === 'web' ? (
                                    <input 
                                        type="date"
                                        value={customFromDate}
                                        onChange={(e) => setCustomFromDate(e.target.value)}
                                        style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd', outline: 'none' }}
                                    />
                                ) : (
                                    <TextInput 
                                        style={[styles.dateInputNative, { borderColor: colors.border, color: colors.textPrimary }]}
                                        value={customFromDate}
                                        onChangeText={setCustomFromDate}
                                        placeholder="YYYY-MM-DD"
                                    />
                                )}
                            </View>
                            <View style={styles.dateInputGroup}>
                                <Typography variant="caption" color={colors.textSecondary}>Đến ngày:</Typography>
                                {Platform.OS === 'web' ? (
                                    <input 
                                        type="date"
                                        value={customToDate}
                                        onChange={(e) => setCustomToDate(e.target.value)}
                                        style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd', outline: 'none' }}
                                    />
                                ) : (
                                    <TextInput 
                                        style={[styles.dateInputNative, { borderColor: colors.border, color: colors.textPrimary }]}
                                        value={customToDate}
                                        onChangeText={setCustomToDate}
                                        placeholder="YYYY-MM-DD"
                                    />
                                )}
                            </View>
                            <TouchableOpacity style={[styles.applyBtn, { backgroundColor: colors.primary }]} onPress={() => fetchSummary()}>
                                <Typography variant="captionBold" color={colors.buttonText}>Lọc</Typography>
                            </TouchableOpacity>
                        </View>
                    )}
                </Card>

                {/* Main Content */}
                {errorMessage ? (
                    <Card style={{ borderLeftWidth: 3, borderLeftColor: colors.danger }}>
                        <Typography variant="body" color={colors.danger}>{errorMessage}</Typography>
                    </Card>
                ) : null}

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Typography variant="body" color={colors.textSecondary} style={{ marginTop: 10 }}>Đang tính toán dữ liệu...</Typography>
                    </View>
                ) : (
                    renderFinancialCards()
                )}

            </ScrollView>
        </View>
    );
};

export default RevenueReportScreen;

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    toolbar: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderBottomWidth: 1 },
    refreshButton: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 12 },
    pillsWrap: { gap: 8 },
    pill: { borderWidth: 1, paddingVertical: 8, paddingHorizontal: 12 },
    center: { padding: 40, alignItems: "center" },
    filterCard: { gap: 12, padding: 12 },
    filterRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    timeBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
    customDateWrap: { flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 },
    dateInputGroup: { gap: 4 },
    dateInputNative: { borderWidth: 1, borderRadius: 4, padding: 8, width: 120 },
    applyBtn: { padding: 10, borderRadius: 8, justifyContent: 'center' },
    cardsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    cardBox: { flex: 1, minWidth: 280, gap: 8, padding: 20 },
    iconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    cardTitle: { marginBottom: 4 }
});
