import * as React from "react";
import { useEffect, useState, useMemo } from "react";
import { Alert, StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, TextInput } from "react-native";
import { DataTableScreen, StatusBadge, formatMoney } from "../components";
import { useAuthStore } from "../store/authStore";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../utils/theme";
import { axiosClient } from "../api/axiosClient";

const OrderDetailView = ({ id }: { id: number }) => {
    const [detail, setDetail] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await axiosClient.get(`/orders/${id}`);
                setDetail(res.data);
            } catch (error) {
                console.error("Error fetching order detail", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    if (loading || !detail) {
        return (
            <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.detailContainer}>
            <Text style={styles.sectionTitle}>Danh sách Sản phẩm ({detail.items?.length || 0})</Text>
            <View style={styles.itemList}>
                {detail.items?.map((item: any, index: number) => (
                    <View key={item.id || index} style={styles.itemRow}>
                        <View style={styles.itemMain}>
                            <Text style={styles.itemName}>{item.productName} ({item.productSku})</Text>
                            {item.note ? <Text style={styles.itemNote}>Ghi chú: {item.note}</Text> : null}
                        </View>
                        <View style={styles.itemStats}>
                            <Text style={styles.itemQty}>SL: {item.qty}</Text>
                            <Text style={styles.itemAmount}>{formatMoney(item.salePrice)}</Text>
                        </View>
                    </View>
                ))}
            </View>
            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tiền hàng:</Text>
                <Text style={styles.summaryValue}>{formatMoney(detail.grossAmount)}</Text>
            </View>
            {detail.discountAmount > 0 && (
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Chiết khấu thường:</Text>
                    <Text style={[styles.summaryValue, { color: theme.colors.error }]}>- {formatMoney(detail.discountAmount)}</Text>
                </View>
            )}
            {detail.couponDiscountAmount > 0 && (
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Chiết khấu Coupon:</Text>
                    <Text style={[styles.summaryValue, { color: theme.colors.error }]}>- {formatMoney(detail.couponDiscountAmount)}</Text>
                </View>
            )}
            {detail.surchargeAmount > 0 && (
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Phụ phí:</Text>
                    <Text style={styles.summaryValue}>+ {formatMoney(detail.surchargeAmount)}</Text>
                </View>
            )}
            <View style={[styles.summaryRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
                <Text style={[styles.summaryLabel, { fontWeight: '700', color: theme.colors.primary }]}>Tổng tiền khách trả:</Text>
                <Text style={[styles.summaryValue, { fontWeight: '700', color: theme.colors.primary, fontSize: 16 }]}>{formatMoney(detail.netAmount)}</Text>
            </View>
        </View>
    );
};

const OrderListScreen = () => {
    const { role } = useAuthStore();
    const navigation = useNavigation<any>();
    const [warehouses, setWarehouses] = useState<any[]>([]);

    useEffect(() => {
        const fetchWarehouses = async () => {
            try {
                const res = await axiosClient.get("/warehouses");
                if (Array.isArray(res.data)) {
                    setWarehouses(res.data);
                } else if (res.data && Array.isArray(res.data.content)) {
                    setWarehouses(res.data.content);
                }
            } catch (err) {
                console.error("Failed to load warehouses", err);
            }
        };
        fetchWarehouses();
    }, []);



    return (
        <>
            <DataTableScreen
                apiUrl="/orders"
                title="Đơn hàng"
                searchPlaceholder="Tìm mã đơn hàng..."
                createAction={{
                    label: "Thêm đơn POS",
                    onPress: () => navigation.navigate("Pos"),
                }}
                renderDetailContent={(row) => <OrderDetailView id={row.id} />}
                rowActions={[
                    {
                        label: "In",
                        tone: "neutral",
                        onPress: (row) => Alert.alert("In đơn", `Tính năng in đơn hàng đang được phát triển.`),
                        showOnDesktop: true,
                        showOnMobile: true,
                    },
                    {
                        label: "Duyệt",
                        onPress: (row) => Alert.alert("Duyệt", `Duyệt ${row?.orderNo || "đơn"}.`),
                        shouldShow: (row) => role === "ADMIN" && ["DRAFT", "PENDING"].includes(String(row?.status || "")),
                    },
                ]}
                renderFilters={(setFilters, currentFilters) => {
                const statuses = ["DRAFT", "POSTED", "CANCELLED", "COMPLETED"];
                
                const datePresets = [
                    { value: '', label: 'Tất cả thời gian' },
                    { value: 'today', label: 'Hôm nay' },
                    { value: 'this_week', label: 'Tuần này' },
                    { value: 'this_month', label: 'Tháng này' },
                    { value: '7days', label: '7 ngày qua' },
                    { value: '30days', label: '30 ngày qua' },
                    { value: 'custom', label: 'Tuỳ chỉnh...' }
                ];

                const handleSelectDatePreset = (preset: string) => {
                    if (!preset) {
                        setFilters({ ...currentFilters, datePreset: '', fromDate: '', toDate: '' });
                        return;
                    }
                    if (preset === 'custom') {
                        setFilters({ ...currentFilters, datePreset: 'custom', fromDate: currentFilters.fromDate, toDate: currentFilters.toDate });
                        return;
                    }
                    const today = new Date();
                    const formatDate = (date: Date) => {
                        const d = new Date(date);
                        let month = '' + (d.getMonth() + 1);
                        let day = '' + d.getDate();
                        const year = d.getFullYear();
                        if (month.length < 2) month = '0' + month;
                        if (day.length < 2) day = '0' + day;
                        return [year, month, day].join('-');
                    };

                    const toDateStr = formatDate(today);
                    let fromDateStr = "";

                    if (preset === 'today') {
                        fromDateStr = toDateStr;
                    } else if (preset === 'this_week') {
                        const monday = new Date(today);
                        const day = monday.getDay() || 7; 
                        monday.setDate(monday.getDate() - day + 1);
                        fromDateStr = formatDate(monday);
                    } else if (preset === '7days') {
                        const last7 = new Date(today);
                        last7.setDate(today.getDate() - 7);
                        fromDateStr = formatDate(last7);
                    } else if (preset === '30days') {
                        const last30 = new Date(today);
                        last30.setDate(today.getDate() - 30);
                        fromDateStr = formatDate(last30);
                    } else if (preset === 'this_month') {
                        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                        fromDateStr = formatDate(firstDay);
                    }

                    setFilters({ ...currentFilters, datePreset: preset, fromDate: fromDateStr + "T00:00:00", toDate: toDateStr + "T23:59:59" });
                };

                return (
                    <View style={{ gap: 20 }}>
                        {/* Time Filter */}
                        <View style={{ gap: 8 }}>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.foreground }}>Thời gian đặt:</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                {datePresets.map(preset => {
                                    const isActive = (currentFilters.datePreset || '') === preset.value;
                                    return (
                                        <TouchableOpacity
                                            key={preset.value}
                                            style={[styles.filterPill, isActive && styles.filterPillActive]}
                                            onPress={() => handleSelectDatePreset(preset.value)}
                                        >
                                            <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>{preset.label}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Custom Date Picker Inputs */}
                            {currentFilters.datePreset === 'custom' && (
                                <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 12, color: theme.colors.mutedForeground, marginBottom: 4 }}>Từ ngày:</Text>
                                        <TextInput 
                                            style={styles.dateInput}
                                            placeholder="YYYY-MM-DD"
                                            value={currentFilters.fromDate?.split("T")[0] || ''}
                                            onChangeText={(text) => setFilters({ ...currentFilters, fromDate: text ? text + "T00:00:00" : "" })}
                                            {...({ type: 'date' } as any)}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 12, color: theme.colors.mutedForeground, marginBottom: 4 }}>Đến ngày:</Text>
                                        <TextInput 
                                            style={styles.dateInput}
                                            placeholder="YYYY-MM-DD"
                                            value={currentFilters.toDate?.split("T")[0] || ''}
                                            onChangeText={(text) => setFilters({ ...currentFilters, toDate: text ? text + "T23:59:59" : "" })}
                                            {...({ type: 'date' } as any)}
                                        />
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Status Filter */}
                        <View style={{ gap: 8 }}>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.foreground }}>Trạng thái:</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                <TouchableOpacity
                                    style={[
                                        styles.filterPill,
                                        !currentFilters.status && styles.filterPillActive
                                    ]}
                                    onPress={() => setFilters({ ...currentFilters, status: '' })}
                                >
                                    <Text style={[styles.filterPillText, !currentFilters.status && styles.filterPillTextActive]}>Tất cả</Text>
                                </TouchableOpacity>
                                {statuses.map(st => (
                                    <TouchableOpacity
                                        key={st}
                                        style={[
                                            styles.filterPill,
                                            currentFilters.status === st && styles.filterPillActive
                                        ]}
                                        onPress={() => setFilters({ ...currentFilters, status: st })}
                                    >
                                        <Text style={[styles.filterPillText, currentFilters.status === st && styles.filterPillTextActive]}>{st}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Warehouse Filter */}
                        <View style={{ flexDirection: 'row', gap: 20, flexWrap: 'wrap' }}>
                            <View style={{ flex: 1, minWidth: 200, gap: 8 }}>
                                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.foreground }}>Kho Hàng:</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                    <TouchableOpacity
                                        style={[styles.filterPill, !currentFilters.warehouseId && styles.filterPillActive]}
                                        onPress={() => setFilters({ ...currentFilters, warehouseId: '' })}
                                    >
                                        <Text style={[styles.filterPillText, !currentFilters.warehouseId && styles.filterPillTextActive]}>Tất cả</Text>
                                    </TouchableOpacity>

                                    {warehouses.map(w => (
                                        <TouchableOpacity
                                            key={w.id}
                                            style={[styles.filterPill, currentFilters.warehouseId === String(w.id) && styles.filterPillActive]}
                                            onPress={() => setFilters({ ...currentFilters, warehouseId: String(w.id) })}
                                        >
                                            <Text style={[styles.filterPillText, currentFilters.warehouseId === String(w.id) && styles.filterPillTextActive]}>{w.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </View>
                );
            }}
                columns={[
                { key: "orderNo", label: "Mã đơn", width: 130 },
                { key: "salesChannel", label: "Kênh", width: 80 },
                { key: "customerName", label: "Khách hàng", flex: 1 },
                { key: "warehouseName", label: "Kho", flex: 1 },
                {
                    key: "orderTime",
                    label: "Ngày",
                    flex: 1,
                    render: (v: any) => (
                        <>
                            {v
                                ? new Date(v).toLocaleDateString("vi-VN")
                                : "—"}
                        </>
                    ),
                },
                {
                    key: "grossAmount",
                    label: "Tiền hàng",
                    flex: 1,
                    render: (v: any) => <>{formatMoney(v)}</>,
                },
                {
                    key: "status",
                    label: "Trạng thái",
                    width: 110,
                    render: (v: any) => <StatusBadge status={v || "—"} />,
                },
                { key: "paymentMethod", label: "P.Thức", width: 100 },
                {
                    key: "netAmount",
                    label: "Tổng tiền",
                    flex: 1,
                    render: (v: any) => <>{formatMoney(v)}</>,
                },
                { key: "createdBy", label: "Nhân viên", flex: 1 },
                { key: "note", label: "Ghi chú", flex: 1.5 },
            ]}
        />
        </>
    );
};

export default OrderListScreen;

const styles = StyleSheet.create({
    detailContainer: {
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: theme.colors.foreground,
        marginBottom: 12,
    },
    itemList: {
        gap: 8,
        marginBottom: 20
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border
    },
    itemMain: {
        flex: 1,
        gap: 4
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.foreground,
    },
    itemNote: {
        fontSize: 12,
        color: theme.colors.mutedForeground,
        fontStyle: 'italic'
    },
    itemStats: {
        alignItems: 'flex-end',
        gap: 4
    },
    itemQty: {
        fontSize: 13,
        fontWeight: '500',
        color: theme.colors.mutedForeground
    },
    itemAmount: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.foreground
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4
    },
    summaryLabel: {
        fontSize: 14,
        color: theme.colors.mutedForeground,
        fontWeight: '500'
    },
    summaryValue: {
        fontSize: 15,
        color: theme.colors.foreground,
        fontWeight: '600'
    },
    filterPill: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border
    },
    filterPillActive: {
        backgroundColor: theme.colors.primary, borderColor: theme.colors.primary
    },
    filterPillText: {
        fontSize: 13, fontWeight: '500', color: theme.colors.foreground
    },
    filterPillTextActive: {
        color: '#fff'
    },
    dateInput: {
        borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md,
        paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: theme.colors.foreground, backgroundColor: theme.colors.background
    }
});
