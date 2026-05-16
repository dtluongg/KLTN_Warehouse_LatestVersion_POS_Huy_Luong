import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from "react-native";
import { DataTableScreen } from "../../../components";
import { axiosClient } from "../../../api/axiosClient";
import { theme } from "../../../utils/theme";

const InventoryMovementListScreen = () => {
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
            apiUrl="/inventory-movements"
            title="Lịch sử nhập xuất kho"
            searchPlaceholder="Tìm theo sản phẩm, kho, loại..."
            hideDefaultDetailAction
            renderFilters={(setFilters, currentFilters) => {
                const movementTypes = [
                    "PURCHASE_IN", "SALE_OUT",
                    "RETURN_IN", "RETURN_OUT",
                    "ADJUST_IN", "ADJUST_OUT"
                ];

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
                            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.foreground }}>Thời gian:</Text>
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

                        {/* Type Filter */}
                        <View style={{ gap: 8 }}>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.foreground }}>Loại giao dịch:</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                <TouchableOpacity
                                    style={[
                                        styles.filterPill,
                                        !currentFilters.movementType && styles.filterPillActive
                                    ]}
                                    onPress={() => setFilters({ ...currentFilters, movementType: '' })}
                                >
                                    <Text style={[styles.filterPillText, !currentFilters.movementType && styles.filterPillTextActive]}>Tất cả</Text>
                                </TouchableOpacity>
                                {movementTypes.map(mt => (
                                    <TouchableOpacity
                                        key={mt}
                                        style={[
                                            styles.filterPill,
                                            currentFilters.movementType === mt && styles.filterPillActive
                                        ]}
                                        onPress={() => setFilters({ ...currentFilters, movementType: mt })}
                                    >
                                        <Text style={[styles.filterPillText, currentFilters.movementType === mt && styles.filterPillTextActive]}>{mt}</Text>
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
                { key: "id", label: "ID", width: 60 },
                { key: "productSku", label: "SKU", width: 120 },
                { key: "productName", label: "Sản phẩm", flex: 2 },
                { key: "warehouseName", label: "Kho", flex: 1 },
                { key: "movementType", label: "Loại", flex: 1 },
                { key: "qty", label: "SL", width: 80,
                    render: (v: any, row: any) => {
                        const isIn = String(row?.movementType || "").endsWith("_IN");
                        const isOut = String(row?.movementType || "").endsWith("_OUT");
                        const sign = isIn ? "+" : isOut ? "-" : "";
                        const bg = isIn ? "#dcfce7" : isOut ? "#fee2e2" : "#f1f5f9";
                        const color = isIn ? "#16a34a" : isOut ? "#dc2626" : "#475569";
                        return (
                            <View style={{ backgroundColor: bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" }}>
                                <Text style={{ color, fontWeight: "700", fontSize: 13 }}>
                                    {sign}{Math.abs(Number(v))}
                                </Text>
                            </View>
                        );
                    }
                },
                { key: "refTable", label: "Nguồn", flex: 1 },
                { key: "refId", label: "Mã chứng từ", flex: 1 },
                { key: "createdBy", label: "Người tạo", flex: 1 },
                { key: "note", label: "Ghi chú", flex: 1.5 },
                {
                    key: "createdAt",
                    label: "Thời gian",
                    flex: 1,
                    render: (v: any) => (
                        <Text>
                            {v ? new Date(v).toLocaleDateString("vi-VN") : "—"}
                        </Text>
                    ),
                },
            ]}
        />
    );
};

export default InventoryMovementListScreen;

const styles = StyleSheet.create({
    filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border },
    filterPillActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    filterPillText: { fontSize: 13, fontWeight: '500', color: theme.colors.foreground },
    filterPillTextActive: { color: '#fff' },
    dateInput: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: theme.colors.foreground, backgroundColor: theme.colors.background }
});

