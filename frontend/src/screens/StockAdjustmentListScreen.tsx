import * as React from "react";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, TextInput } from "react-native";
import { DataTableScreen, StatusBadge } from "../components";
import { useAuthStore } from "../store/authStore";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../utils/theme";
import { axiosClient } from "../api/axiosClient";

const StockAdjustmentDetailView = ({ id }: { id: number }) => {
    const [detail, setDetail] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await axiosClient.get(`/stock-adjustments/${id}`);
                setDetail(res.data);
            } catch (error) {
                console.error("Error fetching adjustment detail", error);
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
                {detail.items?.map((item: any, index: number) => {
                    const isPositive = item.adjustQty > 0;
                    const sign = isPositive ? "+" : "";
                    const color = isPositive ? theme.colors.success : theme.colors.error;
                    
                    return (
                        <View key={item.id || index} style={styles.itemRow}>
                            <View style={styles.itemMain}>
                                <Text style={styles.itemName}>{item.productName} ({item.productSku})</Text>
                            </View>
                            <View style={styles.itemStats}>
                                <Text style={styles.itemQtyLabel}>Biến động:</Text>
                                <Text style={[styles.itemQtyValue, { color }]}>{sign}{item.adjustQty}</Text>
                            </View>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

const StockAdjustmentListScreen = () => {
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
        <DataTableScreen
            apiUrl="/stock-adjustments"
            title="Kiểm kho / Điều chỉnh"
            searchPlaceholder="Tìm mã phiếu kiểm kho..."
            renderDetailContent={(row) => <StockAdjustmentDetailView id={row.id} />}
            createAction={{
                label: "Thêm phiếu kiểm",
                onPress: () => navigation.navigate("StockAdjustmentForm"),
            }}
            rowActions={[
                {
                    label: "Sửa",
                    tone: "neutral",
                    shouldShow: (row) => row?.status === "DRAFT",
                    onPress: (row) => navigation.navigate("StockAdjustmentForm", { id: row.id }),
                },
                {
                    label: "In",
                    tone: "neutral",
                    onPress: (row) =>
                        Alert.alert("In phiếu kiểm", `Tính năng in đang được phát triển.`),
                },
                {
                    label: "Duyệt",
                    onPress: (row) =>
                        Alert.alert("Duyệt", `Duyệt ${row?.adjustNo || "phiếu"}.`),
                    shouldShow: (row) =>
                        role === "ADMIN" &&
                        ["DRAFT", "PENDING"].includes(String(row?.status || "")),
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

                    setFilters({ ...currentFilters, datePreset: preset, fromDate: fromDateStr, toDate: toDateStr });
                };

                return (
                    <View style={{ gap: 20 }}>
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
                            {currentFilters.datePreset === 'custom' && (
                                <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 12, color: theme.colors.mutedForeground, marginBottom: 4 }}>Từ ngày:</Text>
                                        <TextInput 
                                            style={styles.dateInput}
                                            placeholder="YYYY-MM-DD"
                                            value={currentFilters.fromDate || ''}
                                            onChangeText={(text) => setFilters({ ...currentFilters, fromDate: text })}
                                            {...({ type: 'date' } as any)}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 12, color: theme.colors.mutedForeground, marginBottom: 4 }}>Đến ngày:</Text>
                                        <TextInput 
                                            style={styles.dateInput}
                                            placeholder="YYYY-MM-DD"
                                            value={currentFilters.toDate || ''}
                                            onChangeText={(text) => setFilters({ ...currentFilters, toDate: text })}
                                            {...({ type: 'date' } as any)}
                                        />
                                    </View>
                                </View>
                            )}
                        </View>
                        <View style={{ gap: 8 }}>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.foreground }}>Trạng thái:</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                <TouchableOpacity
                                    style={[styles.filterPill, !currentFilters.status && styles.filterPillActive]}
                                    onPress={() => setFilters({ ...currentFilters, status: '' })}
                                >
                                    <Text style={[styles.filterPillText, !currentFilters.status && styles.filterPillTextActive]}>Tất cả</Text>
                                </TouchableOpacity>
                                {statuses.map(st => (
                                    <TouchableOpacity
                                        key={st}
                                        style={[styles.filterPill, currentFilters.status === st && styles.filterPillActive]}
                                        onPress={() => setFilters({ ...currentFilters, status: st })}
                                    >
                                        <Text style={[styles.filterPillText, currentFilters.status === st && styles.filterPillTextActive]}>{st}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
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
                { key: "adjustNo", label: "Mã phiếu", width: 130 },
                { key: "warehouseName", label: "Kho", flex: 1 },
                {
                    key: "adjustDate",
                    label: "Ngày kiểm",
                    flex: 1,
                    render: (v: any) => <>{v ? new Date(v).toLocaleDateString("vi-VN") : "—"}</>,
                },
                {
                    key: "status",
                    label: "Trạng thái",
                    width: 110,
                    render: (v: any) => <StatusBadge status={v || "—"} />,
                },
                { key: "reason", label: "Lý do", flex: 1.5 },
                { key: "createdBy", label: "Người tạo", flex: 1 },
                { key: "note", label: "Ghi chú", flex: 1.5 },
            ]}
        />
    );
};

export default StockAdjustmentListScreen;

const styles = StyleSheet.create({
    detailContainer: { marginTop: 10 },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: theme.colors.foreground, marginBottom: 12 },
    itemList: { gap: 8, marginBottom: 20 },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.border },
    itemMain: { flex: 1, gap: 4 },
    itemName: { fontSize: 14, fontWeight: '600', color: theme.colors.foreground },
    itemStats: { alignItems: 'flex-end', gap: 4 },
    itemQtyLabel: { fontSize: 13, fontWeight: '500', color: theme.colors.mutedForeground },
    itemQtyValue: { fontSize: 16, fontWeight: '700' },
    filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border },
    filterPillActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    filterPillText: { fontSize: 13, fontWeight: '500', color: theme.colors.foreground },
    filterPillTextActive: { color: '#fff' },
    dateInput: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: theme.colors.foreground, backgroundColor: theme.colors.background }
});
