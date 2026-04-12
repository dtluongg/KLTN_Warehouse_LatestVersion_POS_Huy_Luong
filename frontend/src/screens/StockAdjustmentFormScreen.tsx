import React, { useEffect, useState } from "react";
import {
    View, Text, TextInput, ScrollView, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator, FlatList, Modal, Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { axiosClient } from "../api/axiosClient";
import { theme } from "../utils/theme";

interface Warehouse { id: number; name: string; code?: string; }
interface Category { id: number; name: string; }
interface Product { id: number; name: string; sku: string; }
interface LineItem {
    productId: number;
    productName: string;
    productSku: string;
    systemQty: number;
    adjustQty: number; // positive = thêm, negative = giảm
}

const StockAdjustmentFormScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const editId: number | undefined = route.params?.id;
    const isEdit = !!editId;

    const [warehouseId, setWarehouseId] = useState<number | null>(null);
    const [warehouseName, setWarehouseName] = useState<string>("");
    const [adjustDate, setAdjustDate]   = useState<string>(() => new Date().toISOString().substring(0, 10));
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [categoryName, setCategoryName] = useState<string>("");
    const [reason, setReason]           = useState<string>("");
    const [note, setNote]               = useState<string>("");
    const [items, setItems]             = useState<LineItem[]>([]);
    const [status, setStatus]           = useState<string>("DRAFT");

    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts]     = useState<Product[]>([]);
    const [stockByProductId, setStockByProductId] = useState<Record<number, number>>({});
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading]       = useState(isEdit);
    const [showWarehouseModal, setShowWarehouseModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal]   = useState(false);
    const [showProductModal, setShowProductModal]     = useState(false);
    const [productSearch, setProductSearch]           = useState("");
    const submitLockRef = React.useRef(false);

    const canEdit = !isEdit || status === "DRAFT";

    const showMessage = (title: string, message: string, onOk?: () => void) => {
        if (Platform.OS === "web") {
            window.alert(`${title}\n${message}`);
            if (onOk) {
                onOk();
            }
            return;
        }

        if (onOk) {
            Alert.alert(title, message, [{ text: "OK", onPress: onOk }]);
            return;
        }

        Alert.alert(title, message);
    };

    useEffect(() => {
        const load = async () => {
            try {
                const [wRes, cRes] = await Promise.all([
                    axiosClient.get("/warehouses?size=100"),
                    axiosClient.get("/categories?size=200&isActive=true"),
                ]);
                setWarehouses(wRes.data.content || wRes.data || []);
                setCategories(cRes.data.content || cRes.data || []);
            } catch (e) { console.error(e); }
        };
        load();
    }, []);

    useEffect(() => {
        const loadProducts = async () => {
            if (!categoryId) {
                setProducts([]);
                return;
            }

            try {
                const pRes = await axiosClient.get("/products", {
                    params: { size: 500, isActive: true, categoryId },
                });
                setProducts(pRes.data.content || pRes.data || []);
            } catch (e) {
                console.error(e);
            }
        };

        loadProducts();
    }, [categoryId]);

    useEffect(() => {
        const loadStockByWarehouse = async () => {
            if (!warehouseId) {
                setStockByProductId({});
                return;
            }

            try {
                const res = await axiosClient.get("/products/stock-by-warehouse", {
                    params: { warehouseId },
                });
                const stockMap: Record<number, number> = {};
                (res.data || []).forEach((row: any) => {
                    stockMap[Number(row.id)] = Number(row.onHand ?? 0);
                });
                setStockByProductId(stockMap);
            } catch (error) {
                console.error("Failed to load stock-by-warehouse", error);
                setStockByProductId({});
            }
        };

        loadStockByWarehouse();
    }, [warehouseId]);

    useEffect(() => {
        setItems((prev) => prev.map((item) => ({
            ...item,
            systemQty: stockByProductId[item.productId] ?? 0,
        })));
    }, [stockByProductId]);

    useEffect(() => {
        if (!isEdit) return;
        const loadEdit = async () => {
            try {
                const res = await axiosClient.get(`/stock-adjustments/${editId}`);
                const d = res.data;
                setWarehouseId(d.warehouseId || null); setWarehouseName(d.warehouseName || "");
                setAdjustDate(d.adjustDate ? d.adjustDate.substring(0, 10) : "");
                setReason(d.reason || ""); setNote(d.note || "");
                setStatus(d.status || "DRAFT");
                setItems((d.items || []).map((item: any) => ({
                    productId: item.productId, productName: item.productName || "",
                    productSku: item.productSku || "",
                    systemQty: 0,
                    adjustQty: item.adjustQty,
                })));
            } catch (e) { Alert.alert("Lỗi", "Không thể tải phiếu."); }
            finally { setLoading(false); }
        };
        loadEdit();
    }, [editId]);

    const addProduct = (prod: Product) => {
        if (!categoryId) {
            Alert.alert("Thiếu thông tin", "Vui lòng chọn danh mục trước khi thêm sản phẩm.");
            return;
        }
        if (items.find(i => i.productId === prod.id)) {
            Alert.alert("Trùng sản phẩm", "Sản phẩm đã có."); setShowProductModal(false); return;
        }
        setItems(prev => [...prev, {
            productId: prod.id,
            productName: prod.name,
            productSku: prod.sku,
            systemQty: stockByProductId[prod.id] ?? 0,
            adjustQty: 0,
        }]);
        setShowProductModal(false);
    };

    const updateItem = (idx: number, val: number) => {
        setItems(prev => prev.map((it, i) => i === idx ? { ...it, adjustQty: val } : it));
    };

    const removeItem = (idx: number) => { setItems(prev => prev.filter((_, i) => i !== idx)); };

    const handleSubmit = async () => {
        if (!warehouseId) { Alert.alert("Thiếu thông tin", "Chọn kho hàng."); return; }
        if (!categoryId) { Alert.alert("Thiếu thông tin", "Chọn danh mục sản phẩm."); return; }
        if (items.length === 0) { Alert.alert("Thiếu sản phẩm", "Thêm ít nhất 1 sản phẩm."); return; }
        const hasZero = items.some(it => it.adjustQty === 0);
        if (hasZero) { Alert.alert("Thiếu thông tin", "Không thể lưu dòng có chênh lệch = 0. Vui lòng nhập số dương hoặc âm."); return; }
        doSubmit();
    };

    const doSubmit = async () => {
        if (submitLockRef.current) {
            return;
        }

        const today = new Date().toISOString().substring(0, 10);
        setAdjustDate(today);

        const payload = {
            warehouseId, adjustDate: today, reason: reason || null, note: note || null,
            items: items.map(it => ({ productId: it.productId, adjustQty: it.adjustQty })),
        };
        try {
            submitLockRef.current = true;
            setSubmitting(true);
            if (isEdit) {
                await axiosClient.put(`/stock-adjustments/${editId}`, payload);
                showMessage("Thành công", "Đã cập nhật phiếu kiểm kho.", () => navigation.goBack());
            } else {
                const res = await axiosClient.post("/stock-adjustments", payload);
                showMessage("Thành công", `Đã tạo phiếu ${res.data.adjustNo}.`, () => navigation.goBack());
            }
        } catch (err: any) {
            showMessage("Lỗi", err?.response?.data?.message || "Không thể lưu.");
        } finally {
            setSubmitting(false);
            submitLockRef.current = false;
        }
    };

    if (loading) return <View style={styles.loadingBox}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={22} color={theme.colors.foreground} />
                </TouchableOpacity>
                <Text style={styles.title}>{isEdit ? "Sửa phiếu kiểm kho" : "Tạo phiếu kiểm kho / Điều chỉnh"}</Text>
            </View>

            {!canEdit && (
                <View style={styles.lockedBanner}>
                    <Feather name="lock" size={14} color="#92400e" />
                    <Text style={styles.lockedText}>Phiếu đã duyệt ({status}). Không thể chỉnh sửa.</Text>
                </View>
            )}

            <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Thông tin phiếu kiểm</Text>

                    <Text style={styles.label}>Kho kiểm hàng <Text style={styles.required}>*</Text></Text>
                    <TouchableOpacity style={[styles.picker, !canEdit && styles.pickerDisabled]} onPress={() => canEdit && setShowWarehouseModal(true)} disabled={!canEdit}>
                        <Feather name="archive" size={16} color={theme.colors.mutedForeground} />
                        <Text style={[styles.pickerText, !warehouseId && styles.pickerPlaceholder]}>{warehouseName || "Chọn kho..."}</Text>
                        {canEdit && <Feather name="chevron-down" size={16} color={theme.colors.mutedForeground} />}
                    </TouchableOpacity>

                    <Text style={styles.label}>Danh mục sản phẩm <Text style={styles.required}>*</Text></Text>
                    <TouchableOpacity style={[styles.picker, !canEdit && styles.pickerDisabled]} onPress={() => canEdit && setShowCategoryModal(true)} disabled={!canEdit}>
                        <Feather name="tag" size={16} color={theme.colors.mutedForeground} />
                        <Text style={[styles.pickerText, !categoryId && styles.pickerPlaceholder]}>{categoryName || "Chọn danh mục..."}</Text>
                        {canEdit && <Feather name="chevron-down" size={16} color={theme.colors.mutedForeground} />}
                    </TouchableOpacity>

                    <Text style={styles.label}>Ngày kiểm kê <Text style={styles.required}>*</Text></Text>
                    <TextInput style={[styles.input, styles.inputDisabled]}
                        value={adjustDate} onChangeText={setAdjustDate} placeholder="YYYY-MM-DD" editable={false}
                        placeholderTextColor={theme.colors.mutedForeground} />
                    <Text style={styles.lineInputHint}>Ngày kiểm được áp cứng là ngày hiện tại.</Text>

                    <Text style={styles.label}>Lý do điều chỉnh</Text>
                    <TextInput style={[styles.input, !canEdit && styles.inputDisabled]}
                        value={reason} onChangeText={setReason} placeholder="Vd: Kiểm kê định kỳ, hàng hỏng..." editable={canEdit}
                        placeholderTextColor={theme.colors.mutedForeground} />

                    <Text style={styles.label}>Ghi chú</Text>
                    <TextInput style={[styles.input, styles.inputMultiline, !canEdit && styles.inputDisabled]}
                        value={note} onChangeText={setNote} placeholder="Ghi chú thêm..." multiline numberOfLines={3} editable={canEdit}
                        placeholderTextColor={theme.colors.mutedForeground} />
                </View>

                <View style={styles.card}>
                    <View style={styles.sectionRow}>
                        <View>
                            <Text style={styles.sectionTitle}>Sản phẩm điều chỉnh</Text>
                            <Text style={styles.sectionHint}>Chênh lệch (+) bổ sung, (-) giảm tồn kho</Text>
                        </View>
                        {canEdit && (
                            <TouchableOpacity
                                style={styles.addBtn}
                                onPress={() => {
                                    if (!categoryId) {
                                        Alert.alert("Thiếu thông tin", "Vui lòng chọn danh mục trước khi thêm sản phẩm.");
                                        return;
                                    }
                                    setShowProductModal(true);
                                }}
                            >
                                <Feather name="plus" size={16} color="#fff" />
                                <Text style={styles.addBtnText}>Thêm</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    {items.length === 0 ? (
                        <View style={styles.emptyItems}><Feather name="package" size={32} color={theme.colors.muted} /><Text style={styles.emptyItemsText}>Chưa có sản phẩm.</Text></View>
                    ) : items.map((item, idx) => (
                        <View key={item.productId} style={styles.lineItem}>
                            <View style={styles.lineItemHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.lineItemName}>{item.productName}</Text>
                                    <Text style={styles.lineItemSku}>SKU: {item.productSku}</Text>
                                    <Text style={styles.lineItemStock}>Tồn hệ thống hiện tại: {item.systemQty}</Text>
                                </View>
                                {canEdit && <TouchableOpacity onPress={() => removeItem(idx)} style={styles.removeBtn}><Feather name="x" size={18} color={theme.colors.error} /></TouchableOpacity>}
                            </View>
                            <Text style={styles.lineInputLabel}>Số lượng chênh lệch (dương = tăng, âm = giảm)</Text>
                            <TextInput style={[styles.lineInput, !canEdit && styles.inputDisabled, item.adjustQty > 0 && { borderColor: "#16a34a" }, item.adjustQty < 0 && { borderColor: "#dc2626" }]}
                                keyboardType="numeric" value={String(item.adjustQty)}
                                onChangeText={v => updateItem(idx, Number(v.replace(/[^-0-9]/g, "")) || 0)} editable={canEdit} />
                            <Text style={styles.lineInputHint}>Không nhập 0 vì backend sẽ từ chối lưu phiếu.</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {canEdit && (
                <View style={styles.footer}>
                    <View style={styles.footerActions}>
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => navigation.goBack()}
                            disabled={submitting}
                        >
                            <Feather name="x-circle" size={18} color={theme.colors.foreground} />
                            <Text style={styles.cancelBtnText}>Hủy</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={submitting}>
                            {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Feather name="save" size={18} color="#fff" />}
                            <Text style={styles.submitBtnText}>{submitting ? "Đang lưu..." : isEdit ? "Cập nhật phiếu" : "Tạo phiếu kiểm kho"}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <Modal visible={showWarehouseModal} transparent animationType="slide" onRequestClose={() => setShowWarehouseModal(false)}>
                <View style={styles.modalOverlay}><View style={styles.modalBox}>
                    <View style={styles.modalHeader}><Text style={styles.modalTitle}>Chọn kho hàng</Text><TouchableOpacity onPress={() => setShowWarehouseModal(false)}><Feather name="x" size={22} color={theme.colors.foreground} /></TouchableOpacity></View>
                    <FlatList data={warehouses} keyExtractor={w => String(w.id)} renderItem={({ item }) => (
                        <TouchableOpacity style={styles.modalItem} onPress={() => { setWarehouseId(item.id); setWarehouseName(item.name); setShowWarehouseModal(false); }}>
                            <Text style={styles.modalItemName}>{item.name}</Text>
                            {item.code && <Text style={styles.modalItemSub}>Mã: {item.code}</Text>}
                        </TouchableOpacity>
                    )} />
                </View></View>
            </Modal>

            <Modal visible={showCategoryModal} transparent animationType="slide" onRequestClose={() => setShowCategoryModal(false)}>
                <View style={styles.modalOverlay}><View style={styles.modalBox}>
                    <View style={styles.modalHeader}><Text style={styles.modalTitle}>Chọn danh mục</Text><TouchableOpacity onPress={() => setShowCategoryModal(false)}><Feather name="x" size={22} color={theme.colors.foreground} /></TouchableOpacity></View>
                    <FlatList data={categories} keyExtractor={c => String(c.id)} renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.modalItem}
                            onPress={() => {
                                setCategoryId(item.id);
                                setCategoryName(item.name);
                                setShowCategoryModal(false);
                            }}
                        >
                            <Text style={styles.modalItemName}>{item.name}</Text>
                        </TouchableOpacity>
                    )} />
                </View></View>
            </Modal>

            <Modal visible={showProductModal} transparent animationType="slide" onRequestClose={() => setShowProductModal(false)}>
                <View style={styles.modalOverlay}><View style={styles.modalBox}>
                    <View style={styles.modalHeader}><Text style={styles.modalTitle}>Thêm sản phẩm</Text><TouchableOpacity onPress={() => setShowProductModal(false)}><Feather name="x" size={22} color={theme.colors.foreground} /></TouchableOpacity></View>
                    <TextInput style={styles.modalSearch} placeholder="Tìm tên, SKU..." value={productSearch} onChangeText={setProductSearch} placeholderTextColor={theme.colors.mutedForeground} />
                    <FlatList data={products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase()))}
                        keyExtractor={p => String(p.id)} renderItem={({ item }) => (
                            <TouchableOpacity style={styles.modalItem} onPress={() => addProduct(item)}>
                                <Text style={styles.modalItemName}>{item.name}</Text>
                                <Text style={styles.modalItemSub}>SKU: {item.sku}</Text>
                            </TouchableOpacity>
                        )} />
                </View></View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 54, paddingBottom: 16, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    backBtn: { padding: 4 },
    title: { fontSize: 18, fontWeight: "700", color: theme.colors.foreground },
    lockedBanner: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 12, padding: 12, backgroundColor: "#fef3c7", borderRadius: 8, borderWidth: 1, borderColor: "#fde68a" },
    lockedText: { flex: 1, color: "#92400e", fontSize: 13 },
    body: { flex: 1 },
    card: { backgroundColor: theme.colors.surface, margin: 16, marginBottom: 0, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.colors.border },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: theme.colors.foreground },
    sectionHint: { fontSize: 12, color: theme.colors.mutedForeground, marginTop: 2, marginBottom: 14 },
    sectionRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 },
    label: { fontSize: 13, fontWeight: "600", color: theme.colors.mutedForeground, marginBottom: 6, marginTop: 12 },
    required: { color: theme.colors.error },
    input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: theme.colors.foreground, backgroundColor: theme.colors.background },
    inputMultiline: { height: 80, textAlignVertical: "top" },
    inputDisabled: { backgroundColor: theme.colors.muted, color: theme.colors.mutedForeground },
    picker: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11, backgroundColor: theme.colors.background },
    pickerDisabled: { backgroundColor: theme.colors.muted },
    pickerText: { flex: 1, fontSize: 14, color: theme.colors.foreground },
    pickerPlaceholder: { color: theme.colors.mutedForeground },
    addBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: theme.colors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
    addBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
    emptyItems: { alignItems: "center", paddingVertical: 28, gap: 10 },
    emptyItemsText: { color: theme.colors.mutedForeground, fontSize: 13 },
    lineItem: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 12, marginBottom: 10, backgroundColor: theme.colors.background },
    lineItemHeader: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
    lineItemName: { fontSize: 14, fontWeight: "600", color: theme.colors.foreground },
    lineItemSku: { fontSize: 12, color: theme.colors.mutedForeground, marginTop: 2 },
    lineItemStock: { fontSize: 12, color: theme.colors.foreground, marginTop: 4, fontWeight: "600" },
    removeBtn: { padding: 4 },
    lineInputLabel: { fontSize: 11, color: theme.colors.mutedForeground, marginBottom: 4 },
    lineInput: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: theme.colors.foreground, backgroundColor: theme.colors.surface },
    lineInputHint: { fontSize: 11, color: theme.colors.mutedForeground, marginTop: 4 },
    footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.border },
    footerActions: { flexDirection: "row", gap: 12 },
    cancelBtn: {
        minWidth: 120,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    cancelBtnText: { color: theme.colors.foreground, fontSize: 15, fontWeight: "600" },
    submitBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: theme.colors.primary, borderRadius: 12, paddingVertical: 16 },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modalBox: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "75%" },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
    modalTitle: { fontSize: 17, fontWeight: "700", color: theme.colors.foreground },
    modalSearch: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, padding: 12, fontSize: 14, color: theme.colors.foreground, marginBottom: 10 },
    modalItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    modalItemName: { fontSize: 14, fontWeight: "600", color: theme.colors.foreground },
    modalItemSub: { fontSize: 12, color: theme.colors.mutedForeground, marginTop: 2 },
});

export default StockAdjustmentFormScreen;
