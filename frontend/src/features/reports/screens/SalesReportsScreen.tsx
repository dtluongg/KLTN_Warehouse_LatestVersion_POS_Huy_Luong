import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Platform, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../../../hooks/useTheme';
import ScreenHeader from '../../../components/ui/ScreenHeader';
import { Card } from '../../../components/ui/Card';
import { Typography } from '../../../components/ui/Typography';
import EmptyState from '../../../components/ui/EmptyState';
import { axiosClient } from '../../../api/axiosClient';
import { printDocument } from '../../../utils/printUtils';
import {
    generateCashDepositReportHTML,
    generatePaymentMethodReportHTML,
    generateCustomerReturnListReportHTML
} from '../../../utils/printTemplates';

type Warehouse = { id: number; name: string; isActive: boolean; };

const formatCurrency = (value: number | undefined | null) => {
    const safe = Number(value || 0);
    return safe.toLocaleString('vi-VN');
};

const SalesReportsScreen = () => {
    const { colors, metrics } = useTheme();

    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);

    const [activeTab, setActiveTab] = useState<'CASH_DEPOSIT' | 'PAYMENT_METHODS' | 'CUSTOMER_RETURNS'>('CASH_DEPOSIT');

    // Date & Time inputs
    const [fromDate, setFromDate] = useState(() => {
        const d = new Date();
        return d.toISOString().split('T')[0];
    });
    const [fromTime, setFromTime] = useState('00:00:00');

    const [toDate, setToDate] = useState(() => {
        const d = new Date();
        return d.toISOString().split('T')[0];
    });
    const [toTime, setToTime] = useState('23:59:59');

    const [orders, setOrders] = useState<any[]>([]);
    const [returns, setReturns] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const loadWarehouses = useCallback(async () => {
        const res = await axiosClient.get('/warehouses');
        const list: Warehouse[] = Array.isArray(res.data) ? res.data : (res.data?.content || []);
        const active = list.filter((w) => w.isActive !== false);
        setWarehouses(active);

        return selectedWarehouseId;
    }, [selectedWarehouseId]);

    const getIsoRange = () => {
        // e.g. "2024-05-15T00:00:00"
        const fromIso = `${fromDate}T${fromTime}`;
        const toIso = `${toDate}T${toTime}`;
        return { fromIso, toIso };
    };

    const fetchData = useCallback(async (isRefreshing = false) => {
        try {
            if (!isRefreshing) setLoading(true);
            setErrorMessage(null);

            const warehouseId = await loadWarehouses();
            const { fromIso, toIso } = getIsoRange();

            if (activeTab === 'CASH_DEPOSIT' || activeTab === 'PAYMENT_METHODS') {
                const res = await axiosClient.get('/orders', {
                    params: {
                        warehouseId: warehouseId || undefined,
                        fromDate: fromIso,
                        toDate: toIso,
                        status: 'POSTED',
                        size: 1000 // Get all for report
                    }
                });
                setOrders(res.data?.content || res.data || []);
            } else if (activeTab === 'CUSTOMER_RETURNS') {
                // Return endpoints use LocalDate for now in our backend, but we'll send it as fromDate string
                // CustomerReturnSearchCriteria uses LocalDate, so we pass just the date part if needed, or LocalDateTime if updated
                const res = await axiosClient.get('/customer-returns', {
                    params: {
                        warehouseId: warehouseId || undefined,
                        fromDate: fromDate, // Note: Return API might just use date
                        toDate: toDate,
                        status: 'COMPLETED',
                        size: 1000
                    }
                });
                setReturns(res.data?.content || res.data || []);
            }
        } catch (error: any) {
            console.error(error);
            setErrorMessage('Không tải được dữ liệu báo cáo.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [loadWarehouses, activeTab, fromDate, fromTime, toDate, toTime]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    useEffect(() => {
        fetchData();
    }, [selectedWarehouseId]);

    const activeWarehouseName = useMemo(() => {
        if (!selectedWarehouseId) return "Tất cả kho";
        return warehouses.find((w) => w.id === selectedWarehouseId)?.name || "—";
    }, [warehouses, selectedWarehouseId]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData(true);
    };

    const handlePrint = async () => {
        const { fromIso, toIso } = getIsoRange();
        
        let html = '';
        if (activeTab === 'CASH_DEPOSIT') {
            const cashOrders = orders.filter(o => o.paymentMethod === 'CASH');
            html = generateCashDepositReportHTML(cashOrders, fromIso, toIso);
        } else if (activeTab === 'PAYMENT_METHODS') {
            html = generatePaymentMethodReportHTML(orders, fromIso, toIso);
        } else if (activeTab === 'CUSTOMER_RETURNS') {
            html = generateCustomerReturnListReportHTML(returns, fromIso, toIso);
        }

        if (html) {
            await printDocument(html);
        }
    };

    const renderCashDepositTab = () => {
        const cashOrders = orders.filter(o => o.paymentMethod === 'CASH');
        const totalCash = cashOrders.reduce((sum, o) => sum + Number(o.netAmount || 0), 0);

        return (
            <View style={{ gap: 16 }}>
                <Card style={{ backgroundColor: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.2)' }} elevated>
                    <Typography variant="captionBold" style={{ color: '#10b981', marginBottom: 4 }}>TỔNG TIỀN MẶT CẦN NỘP</Typography>
                    <Typography variant="hero" style={{ color: '#059669' }}>{formatCurrency(totalCash)} đ</Typography>
                    <Typography variant="caption" color={colors.textSecondary} style={{ marginTop: 4 }}>Dựa trên {cashOrders.length} hóa đơn thanh toán tiền mặt</Typography>
                </Card>

                {cashOrders.length > 0 ? (
                    <Card style={{ padding: 0, overflow: 'hidden' }}>
                        <View style={[styles.tableHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                            <Typography variant="captionBold" color={colors.textSecondary} style={{ flex: 1 }}>Mã đơn</Typography>
                            <Typography variant="captionBold" color={colors.textSecondary} style={{ flex: 2 }}>Khách hàng</Typography>
                            <Typography variant="captionBold" color={colors.textSecondary} style={{ flex: 1, textAlign: 'right' }}>Thành tiền</Typography>
                        </View>
                        {cashOrders.map((o, idx) => (
                            <View key={o.id} style={[styles.tableRow, { borderBottomColor: colors.border }, idx === cashOrders.length - 1 && { borderBottomWidth: 0 }]}>
                                <Typography variant="body" color={colors.textPrimary} style={{ flex: 1 }}>{o.orderNo}</Typography>
                                <Typography variant="body" color={colors.textPrimary} style={{ flex: 2 }}>{o.customer?.name || 'Khách lẻ'}</Typography>
                                <Typography variant="bodyEmphasized" color={colors.primary} style={{ flex: 1, textAlign: 'right' }}>{formatCurrency(o.netAmount)} đ</Typography>
                            </View>
                        ))}
                    </Card>
                ) : (
                    <EmptyState title="Không có giao dịch tiền mặt trong khoảng thời gian này" />
                )}
            </View>
        );
    };

    const renderPaymentMethodsTab = () => {
        if (orders.length === 0) return <EmptyState title="Không có giao dịch trong thời gian này" />;

        const grouped = orders.reduce((acc, curr) => {
            const method = curr.paymentMethod || 'UNKNOWN';
            if (!acc[method]) acc[method] = { count: 0, total: 0 };
            acc[method].count += 1;
            acc[method].total += Number(curr.netAmount || 0);
            return acc;
        }, {} as Record<string, { count: number, total: number }>);

        return (
            <View style={{ gap: 16 }}>
                <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
                    {Object.entries(grouped).map(([method, data]) => (
                        <Card key={method} style={{ flex: 1, minWidth: 200 }} elevated>
                            <Typography variant="captionBold" color={colors.textSecondary}>{method === 'CASH' ? 'TIỀN MẶT' : method === 'TRANSFER' ? 'CHUYỂN KHOẢN' : method === 'CARD' ? 'QUẸT THẺ' : method}</Typography>
                            <Typography variant="heading2" color={colors.textPrimary} style={{ marginVertical: 4 }}>{formatCurrency(data.total)} đ</Typography>
                            <Typography variant="caption" color={colors.textSecondary}>{data.count} giao dịch</Typography>
                        </Card>
                    ))}
                </View>

                <Card style={{ padding: 0, overflow: 'hidden' }}>
                    <View style={[styles.tableHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                        <Typography variant="captionBold" color={colors.textSecondary} style={{ flex: 1 }}>Mã đơn</Typography>
                        <Typography variant="captionBold" color={colors.textSecondary} style={{ flex: 1 }}>HT Thanh toán</Typography>
                        <Typography variant="captionBold" color={colors.textSecondary} style={{ flex: 1, textAlign: 'right' }}>Thành tiền</Typography>
                    </View>
                    {orders.map((o, idx) => (
                        <View key={o.id} style={[styles.tableRow, { borderBottomColor: colors.border }, idx === orders.length - 1 && { borderBottomWidth: 0 }]}>
                            <Typography variant="body" color={colors.textPrimary} style={{ flex: 1 }}>{o.orderNo}</Typography>
                            <Typography variant="body" color={colors.textSecondary} style={{ flex: 1 }}>{o.paymentMethod}</Typography>
                            <Typography variant="bodyEmphasized" color={colors.textPrimary} style={{ flex: 1, textAlign: 'right' }}>{formatCurrency(o.netAmount)} đ</Typography>
                        </View>
                    ))}
                </Card>
            </View>
        );
    };

    const renderCustomerReturnsTab = () => {
        if (returns.length === 0) return <EmptyState title="Không có khách trả hàng" />;
        
        const totalRefund = returns.reduce((sum, r) => sum + Number(r.totalRefund || 0), 0);

        return (
            <View style={{ gap: 16 }}>
                <Card style={{ backgroundColor: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)' }} elevated>
                    <Typography variant="captionBold" style={{ color: '#ef4444', marginBottom: 4 }}>TỔNG TIỀN HOÀN TRẢ KHÁCH</Typography>
                    <Typography variant="hero" style={{ color: '#dc2626' }}>{formatCurrency(totalRefund)} đ</Typography>
                    <Typography variant="caption" color={colors.textSecondary} style={{ marginTop: 4 }}>Từ {returns.length} phiếu trả hàng</Typography>
                </Card>

                <Card style={{ padding: 0, overflow: 'hidden' }}>
                    <View style={[styles.tableHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                        <Typography variant="captionBold" color={colors.textSecondary} style={{ flex: 1 }}>Mã phiếu</Typography>
                        <Typography variant="captionBold" color={colors.textSecondary} style={{ flex: 2 }}>Khách hàng</Typography>
                        <Typography variant="captionBold" color={colors.textSecondary} style={{ flex: 1, textAlign: 'right' }}>Tiền hoàn trả</Typography>
                    </View>
                    {returns.map((r, idx) => (
                        <View key={r.id} style={[styles.tableRow, { borderBottomColor: colors.border }, idx === returns.length - 1 && { borderBottomWidth: 0 }]}>
                            <Typography variant="body" color={colors.textPrimary} style={{ flex: 1 }}>{r.returnNo}</Typography>
                            <Typography variant="body" color={colors.textPrimary} style={{ flex: 2 }}>{r.customer?.name}</Typography>
                            <Typography variant="bodyEmphasized" color={colors.danger} style={{ flex: 1, textAlign: 'right' }}>{formatCurrency(r.totalRefund)} đ</Typography>
                        </View>
                    ))}
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
                    style={[styles.headerBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                    onPress={() => fetchData()}
                >
                    <Feather name="refresh-cw" size={14} color={colors.primary} />
                    <Typography variant="captionBold" color={colors.primary}>Tải lại</Typography>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.headerBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={handlePrint}
                >
                    <Feather name="printer" size={14} color={colors.buttonText} />
                    <Typography variant="captionBold" color={colors.buttonText}>In Báo cáo (A4)</Typography>
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

                <Card style={styles.filterCard}>
                    <Typography variant="bodyEmphasized" color={colors.textPrimary} style={{ marginBottom: 8 }}>Khoảng thời gian (Ca làm việc)</Typography>
                    
                    <View style={styles.dateFilterContainer}>
                        <View style={styles.dateGroup}>
                            <Typography variant="caption" color={colors.textSecondary}>Từ ngày & giờ:</Typography>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {Platform.OS === 'web' ? (
                                    <>
                                        <input 
                                            type="date"
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                            style={styles.webInput}
                                        />
                                        <input 
                                            type="time"
                                            step="1"
                                            value={fromTime}
                                            onChange={(e) => setFromTime(e.target.value)}
                                            style={styles.webInput}
                                        />
                                    </>
                                ) : (
                                    <TextInput 
                                        style={styles.nativeInput}
                                        value={`${fromDate} ${fromTime}`}
                                        placeholder="YYYY-MM-DD HH:mm:ss"
                                    />
                                )}
                            </View>
                        </View>
                        <View style={styles.dateGroup}>
                            <Typography variant="caption" color={colors.textSecondary}>Đến ngày & giờ:</Typography>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {Platform.OS === 'web' ? (
                                    <>
                                        <input 
                                            type="date"
                                            value={toDate}
                                            onChange={(e) => setToDate(e.target.value)}
                                            style={styles.webInput}
                                        />
                                        <input 
                                            type="time"
                                            step="1"
                                            value={toTime}
                                            onChange={(e) => setToTime(e.target.value)}
                                            style={styles.webInput}
                                        />
                                    </>
                                ) : (
                                    <TextInput 
                                        style={styles.nativeInput}
                                        value={`${toDate} ${toTime}`}
                                        placeholder="YYYY-MM-DD HH:mm:ss"
                                    />
                                )}
                            </View>
                        </View>
                        <TouchableOpacity style={[styles.applyBtn, { backgroundColor: colors.primary }]} onPress={() => fetchData()}>
                            <Typography variant="captionBold" color={colors.buttonText}>Lọc</Typography>
                        </TouchableOpacity>
                    </View>
                </Card>

                <View style={styles.tabsWrap}>
                    <TouchableOpacity 
                        style={[styles.tabBtn, activeTab === 'CASH_DEPOSIT' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} 
                        onPress={() => setActiveTab('CASH_DEPOSIT')}
                    >
                        <Typography variant="bodyEmphasized" color={activeTab === 'CASH_DEPOSIT' ? colors.primary : colors.textSecondary}>Nộp tiền mặt</Typography>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tabBtn, activeTab === 'PAYMENT_METHODS' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} 
                        onPress={() => setActiveTab('PAYMENT_METHODS')}
                    >
                        <Typography variant="bodyEmphasized" color={activeTab === 'PAYMENT_METHODS' ? colors.primary : colors.textSecondary}>Loại tiền chi tiết</Typography>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tabBtn, activeTab === 'CUSTOMER_RETURNS' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} 
                        onPress={() => setActiveTab('CUSTOMER_RETURNS')}
                    >
                        <Typography variant="bodyEmphasized" color={activeTab === 'CUSTOMER_RETURNS' ? colors.primary : colors.textSecondary}>Khách trả hàng</Typography>
                    </TouchableOpacity>
                </View>

                {errorMessage ? (
                    <Card style={{ borderLeftWidth: 3, borderLeftColor: colors.danger }}>
                        <Typography variant="body" color={colors.danger}>{errorMessage}</Typography>
                    </Card>
                ) : null}

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <View>
                        {activeTab === 'CASH_DEPOSIT' && renderCashDepositTab()}
                        {activeTab === 'PAYMENT_METHODS' && renderPaymentMethodsTab()}
                        {activeTab === 'CUSTOMER_RETURNS' && renderCustomerReturnsTab()}
                    </View>
                )}

            </ScrollView>
        </View>
    );
};

export default SalesReportsScreen;

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    pillsWrap: { gap: 8 },
    pill: { borderWidth: 1, paddingVertical: 8, paddingHorizontal: 12 },
    toolbar: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderBottomWidth: 1 },
    headerBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
    center: { padding: 40, alignItems: "center" },
    filterCard: { padding: 16 },
    dateFilterContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' },
    dateGroup: { gap: 4 },
    webInput: { padding: 8, borderRadius: 4, border: '1px solid #ddd', outline: 'none' },
    nativeInput: { borderWidth: 1, borderRadius: 4, padding: 8, width: 180, borderColor: '#ddd' },
    applyBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center' },
    tabsWrap: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', gap: 16 },
    tabBtn: { paddingVertical: 12, paddingHorizontal: 8 },
    tableHeader: { flexDirection: 'row', padding: 12, borderBottomWidth: 1 },
    tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, alignItems: 'center' }
});
