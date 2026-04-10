import React, { useEffect, useState, useCallback } from "react";
import {
    View, Text, TextInput, ScrollView, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator, FlatList, Modal,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { axiosClient } from "../api/axiosClient";
import { theme } from "../utils/theme";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Supplier { id: string; name: string; phone?: string; }
interface Warehouse { id: number; name: string; code?: string; }
interface Product { id: number; name: string; sku: string; lastPurchaseCost?: number; vatRate?: number; }
interface LineItem {
    productId: number;
    productName: string;
    productSku: string;
    orderedQty: number;
    expectedUnitCost: number;
    vatRate: number; // % nguyên, ví dụ 8 = 8%
}

// ─── Component ────────────────────────────────────────────────────────────────
const PurchaseOrderFormScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const editId: number | undefined = route.params?.id;
    const isEdit = !!editId;

    // Form state
    const [supplierId, setSupplierId]     = useState<string>("");
    const [supplierName, setSupplierName] = useState<string>("");
    const [warehouseId, setWarehouseId]   = useState<number | null>(null);
    const [warehouseName, setWarehouseName] = useState<string>("");
    const [expectedDate, setExpectedDate] = useState<string>("");
    const [note, setNote]                 = useState<string>("");
    const [discountAmount, setDiscountAmount] = useState<string>("0");
    const [surchargeAmount, setSurchargeAmount] = useState<string>("0");
    const [items, setItems]               = useState<LineItem[]>([]);
    const [status, setStatus]             = useState<string>("DRAFT");

    // UI state
    const [suppliers, setSuppliers]   = useState<Supplier[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [products, setProducts]     = useState<Product[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading]       = useState(isEdit);

    // Picker modals
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [showWarehouseModal, setShowWarehouseModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [supplierSearch, setSupplierSearch] = useState("");
    const [productSearch, setProductSearch]   = useState("");

    // ── Load reference data ──
    useEffect(() => {
        const load = async () => {
            try {
                const [sRes, wRes, pRes] = await Promise.all([
                    axiosClient.get("/suppliers?size=200"),
                    axiosClient.get("/warehouses?size=100"),
                    axiosClient.get("/products?size=500&isActive=true"),
                ]);
                setSuppliers(sRes.data.content || sRes.data || []);
                setWarehouses(wRes.data.content || wRes.data || []);
                setProducts(pRes.data.content || pRes.data || []);
            } catch (e) { console.error("Load ref data:", e); }
        };
        load();
    }, []);

    // ── Load edit data ──
    useEffect(() => {
        if (!isEdit) return;
        const loadEdit = async () => {
            try {
                const res = await axiosClient.get(`/purchase-orders/${editId}`);
                const d = res.data;
                setSupplierId(d.supplierId || "");
                setSupplierName(d.supplierName || "");
                setWarehouseId(d.warehouseId || null);
                setWarehouseName(d.warehouseName || "");
                setExpectedDate(d.expectedDate ? d.expectedDate.substring(0, 10) : "");
                setNote(d.note || "");
                setDiscountAmount(String(d.discountAmount ?? 0));
                setSurchargeAmount(String(d.surchargeAmount ?? 0));
                setStatus(d.status || "DRAFT");
                setItems((d.items || []).map((item: any) => ({
                    productId: item.productId,
                    productName: item.productName || item.product?.name || "",
                    productSku: item.productSku || item.product?.sku || "",
                    orderedQty: item.orderedQty,
                    expectedUnitCost: item.expectedUnitCost,
                    vatRate: item.vatRate ?? 0,
                })));
            } catch (e) { Alert.alert("Lỗi", "Không thể tải dữ liệu phiếu."); }
            finally { setLoading(false); }
        };
        loadEdit();
    }, [editId]);

    // ── Computed ──
    const grossAmount = items.reduce((s, i) => s + i.orderedQty * i.expectedUnitCost, 0);
    const vatAmount   = items.reduce((s, i) => s + i.orderedQty * i.expectedUnitCost * (i.vatRate / 100), 0);
    const netAmount   = grossAmount + vatAmount - Number(discountAmount || 0) + Number(surchargeAmount || 0);

    // ── Helpers ──
    const addProduct = (prod: Product) => {
        if (items.find(i => i.productId === prod.id)) {
            Alert.alert("Trùng sản phẩm", "Sản phẩm này đã có trong danh sách.");
            setShowProductModal(false);
            return;
        }
        setItems(prev => [...prev, {
            productId: prod.id,
            productName: prod.name,
            productSku: prod.sku,
            orderedQty: 1,
            expectedUnitCost: prod.lastPurchaseCost ?? 0,
            vatRate: prod.vatRate ?? 0,
        }]);
        setShowProductModal(false);
    };

    const updateItem = (idx: number, field: keyof LineItem, val: any) => {
        setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
    };

    const removeItem = (idx: number) => {
        setItems(prev => prev.filter((_, i) => i !== idx));
    };

    // ── Submit ──
    const handleSubmit = async () => {
        if (!supplierId) { Alert.alert("Thiếu thông tin", "Vui lòng chọn nhà cung cấp."); return; }
        if (!warehouseId) { Alert.alert("Thiếu thông tin", "Vui lòng chọn kho hàng."); return; }
        if (items.length === 0) { Alert.alert("Thiếu sản phẩm", "Thêm ít nhất 1 sản phẩm vào đơn."); return; }

        const payload = {
            supplierId,
            warehouseId,
            expectedDate: expectedDate || null,
            note: note || null,
            discountAmount: Number(discountAmount) || 0,
            surchargeAmount: Number(surchargeAmount) || 0,
            items: items.map(it => ({
                productId: it.productId,
                orderedQty: it.orderedQty,
                expectedUnitCost: it.expectedUnitCost,
            })),
        };

        try {
            setSubmitting(true);
            if (isEdit) {
                await axiosClient.put(`/purchase-orders/${editId}`, payload);
                Alert.alert("Thành công", "Đã cập nhật phiếu đặt hàng.");
            } else {
                const res = await axiosClient.post("/purchase-orders", payload);
                Alert.alert("Thành công", `Đã tạo phiếu ${res.data.poNo}.`);
            }
            navigation.goBack();
        } catch (err: any) {
            Alert.alert("Lỗi", err?.response?.data?.message || "Không thể lưu phiếu.");
        } finally { setSubmitting(false); }
    };

    const canEdit = !isEdit || status === "DRAFT";

    // ─── Render ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Đang tải phiếu...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={22} color={theme.colors.foreground} />
                </TouchableOpacity>
                <View style={styles.headerTitle}>
                    <Text style={styles.title}>{isEdit ? "Sửa đơn đặt hàng" : "Tạo đơn đặt hàng NCC"}</Text>
                    {isEdit && (
                        <View style={[styles.statusBadge, status !== "DRAFT" && styles.statusBadgeLocked]}>
                            <Text style={styles.statusBadgeText}>{status}</Text>
                        </View>
                    )}
                </View>
            </View>

            {!canEdit && (
                <View style={styles.lockedBanner}>
                    <Feather name="lock" size={14} color="#92400e" />
                    <Text style={styles.lockedText}>Phiếu đã được duyệt (trạng thái {status}). Không thể chỉnh sửa.</Text>
                </View>
            )}

            <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">

                {/* ── Section: Nhà cung cấp & Kho ── */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Thông tin chung</Text>

                    <Text style={styles.label}>Nhà cung cấp <Text style={styles.required}>*</Text></Text>
                    <TouchableOpacity
                        style={[styles.picker, !canEdit && styles.pickerDisabled]}
                        onPress={() => canEdit && setShowSupplierModal(true)}
                        disabled={!canEdit}
                    >
                        <Feather name="briefcase" size={16} color={theme.colors.mutedForeground} />
                        <Text style={[styles.pickerText, !supplierId && styles.pickerPlaceholder]}>
                            {supplierName || "Chọn nhà cung cấp..."}
                        </Text>
                        {canEdit && <Feather name="chevron-down" size={16} color={theme.colors.mutedForeground} />}
                    </TouchableOpacity>

                    <Text style={styles.label}>Kho nhận hàng <Text style={styles.required}>*</Text></Text>
                    <TouchableOpacity
                        style={[styles.picker, !canEdit && styles.pickerDisabled]}
                        onPress={() => canEdit && setShowWarehouseModal(true)}
                        disabled={!canEdit}
                    >
                        <Feather name="archive" size={16} color={theme.colors.mutedForeground} />
                        <Text style={[styles.pickerText, !warehouseId && styles.pickerPlaceholder]}>
                            {warehouseName || "Chọn kho hàng..."}
                        </Text>
                        {canEdit && <Feather name="chevron-down" size={16} color={theme.colors.mutedForeground} />}
                    </TouchableOpacity>

                    <Text style={styles.label}>Ngày dự kiến nhận</Text>
                    <TextInput
                        style={[styles.input, !canEdit && styles.inputDisabled]}
                        value={expectedDate}
                        onChangeText={setExpectedDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={theme.colors.mutedForeground}
                        editable={canEdit}
                    />

                    <Text style={styles.label}>Ghi chú</Text>
                    <TextInput
                        style={[styles.input, styles.inputMultiline, !canEdit && styles.inputDisabled]}
                        value={note}
                        onChangeText={setNote}
                        placeholder="Ghi chú cho đơn hàng..."
                        placeholderTextColor={theme.colors.mutedForeground}
                        multiline
                        numberOfLines={3}
                        editable={canEdit}
                    />
                </View>

                {/* ── Section: Sản phẩm ── */}
                <View style={styles.card}>
                    <View style={styles.sectionRow}>
                        <Text style={styles.sectionTitle}>Danh sách sản phẩm</Text>
                        {canEdit && (
                            <TouchableOpacity style={styles.addBtn} onPress={() => setShowProductModal(true)}>
                                <Feather name="plus" size={16} color={theme.colors.primaryForeground} />
                                <Text style={styles.addBtnText}>Thêm</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {items.length === 0 ? (
                        <View style={styles.emptyItems}>
                            <Feather name="package" size={32} color={theme.colors.muted} />
                            <Text style={styles.emptyItemsText}>Chưa có sản phẩm. Nhấn "Thêm" để bổ sung.</Text>
                        </View>
                    ) : (
                        items.map((item, idx) => (
                            <View key={item.productId} style={styles.lineItem}>
                                <View style={styles.lineItemHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.lineItemName}>{item.productName}</Text>
                                        <Text style={styles.lineItemSku}>SKU: {item.productSku}</Text>
                                    </View>
                                    {item.vatRate > 0 && (
                                        <View style={styles.vatBadge}>
                                            <Text style={styles.vatBadgeText}>VAT {item.vatRate}%</Text>
                                        </View>
                                    )}
                                    {canEdit && (
                                        <TouchableOpacity onPress={() => removeItem(idx)} style={styles.removeBtn}>
                                            <Feather name="x" size={18} color={theme.colors.error} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <View style={styles.lineItemInputRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.lineInputLabel}>Số lượng</Text>
                                        <TextInput
                                            style={[styles.lineInput, !canEdit && styles.inputDisabled]}
                                            keyboardType="numeric"
                                            value={String(item.orderedQty)}
                                            onChangeText={v => updateItem(idx, "orderedQty", Number(v) || 0)}
                                            editable={canEdit}
                                        />
                                    </View>
                                    <View style={{ flex: 1.5 }}>
                                        <Text style={styles.lineInputLabel}>Giá đặt (VND)</Text>
                                        <TextInput
                                            style={[styles.lineInput, !canEdit && styles.inputDisabled]}
                                            keyboardType="numeric"
                                            value={String(item.expectedUnitCost)}
                                            onChangeText={v => updateItem(idx, "expectedUnitCost", Number(v) || 0)}
                                            editable={canEdit}
                                        />
                                    </View>
                                    <View style={{ flex: 1.5, alignItems: "flex-end", justifyContent: "flex-end" }}>
                                        <Text style={styles.lineInputLabel}>
                                            Thành tiền{item.vatRate > 0 ? ` (+${item.vatRate}%VAT)` : ""}
                                        </Text>
                                        <Text style={styles.lineSubtotal}>
                                            {(item.orderedQty * item.expectedUnitCost * (1 + item.vatRate / 100)).toLocaleString("vi-VN")} đ
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* ── Section: Chiết khấu / Phụ phí ── */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Điều chỉnh giá</Text>
                    <View style={styles.rowInputs}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Chiết khấu (VND)</Text>
                            <TextInput
                                style={[styles.input, !canEdit && styles.inputDisabled]}
                                keyboardType="numeric"
                                value={discountAmount}
                                onChangeText={setDiscountAmount}
                                editable={canEdit}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Phụ phí (VND)</Text>
                            <TextInput
                                style={[styles.input, !canEdit && styles.inputDisabled]}
                                keyboardType="numeric"
                                value={surchargeAmount}
                                onChangeText={setSurchargeAmount}
                                editable={canEdit}
                            />
                        </View>
                    </View>
                </View>

                {/* ── Section: Tổng kết ── */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tiền hàng:</Text>
                        <Text style={styles.summaryValue}>{grossAmount.toLocaleString("vi-VN")} đ</Text>
                    </View>
                    {vatAmount > 0 && (
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Thuế VAT:</Text>
                            <Text style={[styles.summaryValue, { color: "#f59e0b" }]}>+ {vatAmount.toLocaleString("vi-VN")} đ</Text>
                        </View>
                    )}
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Chiết khấu:</Text>
                        <Text style={styles.summaryValue}>- {Number(discountAmount||0).toLocaleString("vi-VN")} đ</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Phụ phí:</Text>
                        <Text style={styles.summaryValue}>+ {Number(surchargeAmount||0).toLocaleString("vi-VN")} đ</Text>
                    </View>
                    <View style={[styles.summaryRow, styles.summaryTotal]}>
                        <Text style={styles.summaryTotalLabel}>Tổng cộng:</Text>
                        <Text style={styles.summaryTotalValue}>{netAmount.toLocaleString("vi-VN")} đ</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Submit Button */}
            {canEdit && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Feather name="save" size={18} color="#fff" />
                        }
                        <Text style={styles.submitBtnText}>
                            {submitting ? "Đang lưu..." : isEdit ? "Cập nhật phiếu" : "Tạo phiếu đặt hàng"}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ── Supplier Picker Modal ── */}
            <Modal visible={showSupplierModal} transparent animationType="slide" onRequestClose={() => setShowSupplierModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn nhà cung cấp</Text>
                            <TouchableOpacity onPress={() => setShowSupplierModal(false)}>
                                <Feather name="x" size={22} color={theme.colors.foreground} />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.modalSearch}
                            placeholder="Tìm nhà cung cấp..."
                            placeholderTextColor={theme.colors.mutedForeground}
                            value={supplierSearch}
                            onChangeText={setSupplierSearch}
                        />
                        <FlatList
                            data={suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()))}
                            keyExtractor={s => s.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.modalItem} onPress={() => {
                                    setSupplierId(item.id);
                                    setSupplierName(item.name);
                                    setShowSupplierModal(false);
                                    setSupplierSearch("");
                                }}>
                                    <Text style={styles.modalItemName}>{item.name}</Text>
                                    {item.phone && <Text style={styles.modalItemSub}>{item.phone}</Text>}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* ── Warehouse Picker Modal ── */}
            <Modal visible={showWarehouseModal} transparent animationType="slide" onRequestClose={() => setShowWarehouseModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn kho hàng</Text>
                            <TouchableOpacity onPress={() => setShowWarehouseModal(false)}>
                                <Feather name="x" size={22} color={theme.colors.foreground} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={warehouses}
                            keyExtractor={w => String(w.id)}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.modalItem} onPress={() => {
                                    setWarehouseId(item.id);
                                    setWarehouseName(item.name);
                                    setShowWarehouseModal(false);
                                }}>
                                    <Text style={styles.modalItemName}>{item.name}</Text>
                                    {item.code && <Text style={styles.modalItemSub}>Mã kho: {item.code}</Text>}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* ── Product Picker Modal ── */}
            <Modal visible={showProductModal} transparent animationType="slide" onRequestClose={() => setShowProductModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Thêm sản phẩm</Text>
                            <TouchableOpacity onPress={() => setShowProductModal(false)}>
                                <Feather name="x" size={22} color={theme.colors.foreground} />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.modalSearch}
                            placeholder="Tìm theo tên, SKU..."
                            placeholderTextColor={theme.colors.mutedForeground}
                            value={productSearch}
                            onChangeText={setProductSearch}
                        />
                        <FlatList
                            data={products.filter(p =>
                                p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                                p.sku.toLowerCase().includes(productSearch.toLowerCase())
                            )}
                            keyExtractor={p => String(p.id)}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.modalItem} onPress={() => addProduct(item)}>
                                    <Text style={styles.modalItemName}>{item.name}</Text>
                                    <Text style={styles.modalItemSub}>SKU: {item.sku}
                                        {item.lastPurchaseCost ? ` · Giá nhập gần nhất: ${Number(item.lastPurchaseCost).toLocaleString("vi-VN")} đ` : ""}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    loadingBox: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
    loadingText: { color: theme.colors.mutedForeground, fontSize: 14 },

    // Header
    header: {
        flexDirection: "row", alignItems: "center", gap: 12,
        paddingHorizontal: 16, paddingTop: 54, paddingBottom: 16,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1, borderBottomColor: theme.colors.border,
    },
    backBtn: { padding: 4 },
    headerTitle: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
    title: { fontSize: 18, fontWeight: "700", color: theme.colors.foreground },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: "#dcfce7" },
    statusBadgeLocked: { backgroundColor: "#fef3c7" },
    statusBadgeText: { fontSize: 11, fontWeight: "700", color: "#065f46" },

    lockedBanner: {
        flexDirection: "row", alignItems: "center", gap: 8,
        marginHorizontal: 16, marginTop: 12, padding: 12,
        backgroundColor: "#fef3c7", borderRadius: 8,
        borderWidth: 1, borderColor: "#fde68a",
    },
    lockedText: { flex: 1, color: "#92400e", fontSize: 13 },

    body: { flex: 1 },

    // Cards
    card: {
        backgroundColor: theme.colors.surface, margin: 16,
        marginBottom: 0, borderRadius: 12, padding: 16,
        borderWidth: 1, borderColor: theme.colors.border,
    },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: theme.colors.foreground, marginBottom: 14 },
    sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },

    // Form inputs
    label: { fontSize: 13, fontWeight: "600", color: theme.colors.mutedForeground, marginBottom: 6, marginTop: 12 },
    required: { color: theme.colors.error },
    input: {
        borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8,
        paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
        color: theme.colors.foreground, backgroundColor: theme.colors.background,
    },
    inputMultiline: { height: 80, textAlignVertical: "top" },
    inputDisabled: { backgroundColor: theme.colors.muted, color: theme.colors.mutedForeground },

    picker: {
        flexDirection: "row", alignItems: "center", gap: 8,
        borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8,
        paddingHorizontal: 12, paddingVertical: 11, backgroundColor: theme.colors.background,
    },
    pickerDisabled: { backgroundColor: theme.colors.muted },
    pickerText: { flex: 1, fontSize: 14, color: theme.colors.foreground },
    pickerPlaceholder: { color: theme.colors.mutedForeground },

    rowInputs: { flexDirection: "row", gap: 12 },

    // Line Items
    addBtn: {
        flexDirection: "row", alignItems: "center", gap: 4,
        backgroundColor: theme.colors.primary, borderRadius: 8,
        paddingHorizontal: 12, paddingVertical: 7,
    },
    addBtnText: { color: theme.colors.primaryForeground, fontSize: 13, fontWeight: "700" },

    emptyItems: { alignItems: "center", paddingVertical: 28, gap: 10 },
    emptyItemsText: { color: theme.colors.mutedForeground, fontSize: 13, textAlign: "center" },

    lineItem: {
        borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8,
        padding: 12, marginBottom: 10, backgroundColor: theme.colors.background,
    },
    lineItemHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
    lineItemName: { fontSize: 14, fontWeight: "700", color: theme.colors.foreground, flex: 1 },
    lineItemSku: { fontSize: 12, color: theme.colors.mutedForeground, marginTop: 2 },
    vatBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: "#fef9c3" },
    vatBadgeText: { fontSize: 11, fontWeight: "700", color: "#92400e" },
    removeBtn: { padding: 4 },

    lineItemInputRow: { flexDirection: "row", gap: 8, alignItems: "flex-end" },
    lineInputLabel: { fontSize: 11, color: theme.colors.mutedForeground, marginBottom: 4 },
    lineInput: {
        borderWidth: 1, borderColor: theme.colors.border, borderRadius: 6,
        paddingHorizontal: 10, paddingVertical: 8, fontSize: 14,
        color: theme.colors.foreground, backgroundColor: theme.colors.surface,
    },
    lineSubtotal: { fontSize: 14, fontWeight: "700", color: theme.colors.primary, paddingBottom: 8 },

    // Summary
    summaryCard: {
        margin: 16, marginTop: 12, borderRadius: 12, padding: 16,
        backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
    },
    summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    summaryLabel: { color: theme.colors.mutedForeground, fontSize: 14 },
    summaryValue: { color: theme.colors.foreground, fontSize: 14 },
    summaryTotal: { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12, marginTop: 4 },
    summaryTotalLabel: { fontSize: 16, fontWeight: "700", color: theme.colors.foreground },
    summaryTotalValue: { fontSize: 18, fontWeight: "700", color: theme.colors.primary },

    // Footer
    footer: {
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: 16, backgroundColor: theme.colors.surface,
        borderTopWidth: 1, borderTopColor: theme.colors.border,
    },
    submitBtn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
        backgroundColor: theme.colors.primary, borderRadius: 12, paddingVertical: 16,
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modalBox: {
        backgroundColor: theme.colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: 20, maxHeight: "75%",
    },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
    modalTitle: { fontSize: 17, fontWeight: "700", color: theme.colors.foreground },
    modalSearch: {
        borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10,
        padding: 12, fontSize: 14, color: theme.colors.foreground, marginBottom: 10,
    },
    modalItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    modalItemName: { fontSize: 14, fontWeight: "600", color: theme.colors.foreground },
    modalItemSub: { fontSize: 12, color: theme.colors.mutedForeground, marginTop: 2 },
});

export default PurchaseOrderFormScreen;
