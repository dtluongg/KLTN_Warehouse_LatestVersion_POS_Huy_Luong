import React, { useEffect, useState } from "react";
import {
    View, Text, TextInput, ScrollView, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator, FlatList, Modal,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { axiosClient } from "../api/axiosClient";
import { theme } from "../utils/theme";

interface Supplier { id: string; name: string; phone?: string; }
interface Warehouse { id: number; name: string; code?: string; }
interface Product { id: number; name: string; sku: string; avgCost?: number; }
interface GROption { id: number; grNo: string; totalAmountPayable?: number; receiptDate?: string; }

interface LineItem {
    productId: number;
    productName: string;
    productSku: string;
    goodsReceiptItemId?: number;
    qty: number;
    returnAmount: number;
    vatRate: number; // % nguyên, ví dụ 8 = 8%
    note: string;
    receivedQty?: number;
    returnedQty?: number;
    pendingQty?: number;
    availableQty?: number;
    unitCost?: number;
}

const SupplierReturnFormScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const editId: number | undefined = route.params?.id;
    const isEdit = !!editId;

    const [supplierId, setSupplierId]     = useState<string>("");
    const [supplierName, setSupplierName] = useState<string>("");
    const [goodsReceiptId, setGoodsReceiptId] = useState<number | null>(null);
    const [goodsReceiptNo, setGoodsReceiptNo] = useState<string>("");
    const [warehouseId, setWarehouseId]   = useState<number | null>(null);
    const [warehouseName, setWarehouseName] = useState<string>("");
    const [note, setNote]                 = useState<string>("");
    const [discountAmount, setDiscountAmount]   = useState<string>("0");
    const [surchargeAmount, setSurchargeAmount] = useState<string>("0");
    const [items, setItems]               = useState<LineItem[]>([]);
    const [status, setStatus]             = useState<string>("DRAFT");

    const [suppliers, setSuppliers]       = useState<Supplier[]>([]);
    const [warehouses, setWarehouses]     = useState<Warehouse[]>([]);
    const [products, setProducts]         = useState<Product[]>([]);
    const [supplierGRs, setSupplierGRs]   = useState<GROption[]>([]);

    const [submitting, setSubmitting]   = useState(false);
    const [loading, setLoading]         = useState(isEdit);
    const [loadingGRs, setLoadingGRs]   = useState(false);

    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [showGRModal, setShowGRModal]             = useState(false);
    const [showWarehouseModal, setShowWarehouseModal] = useState(false);
    const [showProductModal, setShowProductModal]   = useState(false);
    const [supplierSearch, setSupplierSearch] = useState("");
    const [grSearch, setGrSearch]             = useState("");
    const [productSearch, setProductSearch]   = useState("");

    const grossReturn = items.reduce((s, i) => s + i.returnAmount, 0);
    const vatReturn   = items.reduce((s, i) => s + i.returnAmount * (i.vatRate / 100), 0);
    const totalReturn = grossReturn + vatReturn;
    const canEdit     = !isEdit || status === "DRAFT";

    const calcReturnAmount = (qty: number, unitCost?: number) => {
        const safeQty = Number.isFinite(qty) ? Math.max(0, qty) : 0;
        const safeUnitCost = Number.isFinite(unitCost) ? Number(unitCost) : 0;
        return safeQty * safeUnitCost;
    };

    const buildGrItemReturnStats = async (selectedGrId: number, excludedReturnId?: number) => {
        const postedByGrItemId = new Map<number, number>();
        const pendingByGrItemId = new Map<number, number>();

        const [postedRes, draftRes] = await Promise.all([
            axiosClient.get("/supplier-returns?status=POSTED&page=0&size=500&sortBy=id&direction=desc"),
            axiosClient.get("/supplier-returns?status=DRAFT&page=0&size=500&sortBy=id&direction=desc"),
        ]);
        const postedRows: any[] = postedRes.data?.content || postedRes.data || [];
        const draftRows: any[] = draftRes.data?.content || draftRes.data || [];

        const postedForGr = postedRows.filter((row) => Number(row?.goodsReceiptId) === Number(selectedGrId));
        const draftForGr = draftRows.filter(
            (row) => Number(row?.goodsReceiptId) === Number(selectedGrId) && Number(row?.id) !== Number(excludedReturnId || 0),
        );

        const collectMap = async (rows: any[], targetMap: Map<number, number>) => {
            await Promise.all(
                rows.map(async (row) => {
                    const detailRes = await axiosClient.get(`/supplier-returns/${row.id}`);
                    const detailItems: any[] = detailRes.data?.items || [];
                    detailItems.forEach((it) => {
                        const grItemId = Number(it?.goodsReceiptItemId);
                        if (!Number.isFinite(grItemId) || grItemId <= 0) return;
                        const qty = Number(it?.qty || 0);
                        targetMap.set(grItemId, (targetMap.get(grItemId) || 0) + qty);
                    });
                }),
            );
        };

        await collectMap(postedForGr, postedByGrItemId);
        await collectMap(draftForGr, pendingByGrItemId);

        return { postedByGrItemId, pendingByGrItemId };
    };

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
            } catch (e) { console.error(e); }
        };
        load();
    }, []);

    // Khi chọn NCC → load danh sách GR của NCC đó
    const handleSelectSupplier = async (supplier: Supplier) => {
        setSupplierId(supplier.id);
        setSupplierName(supplier.name);
        setShowSupplierModal(false);
        setSupplierSearch("");
        // Reset GR selection & items
        setGoodsReceiptId(null);
        setGoodsReceiptNo("");
        setItems([]);
        setSupplierGRs([]);
        // Load GRs của nhà cung cấp này
        setLoadingGRs(true);
        try {
            const res = await axiosClient.get(`/goods-receipts?supplierId=${supplier.id}&size=100`);
            setSupplierGRs((res.data.content || res.data || []).map((gr: any) => ({
                id: gr.id,
                grNo: gr.grNo,
                totalAmountPayable: gr.totalAmountPayable,
                receiptDate: gr.receiptDate,
            })));
        } catch (e) { console.error("Load supplier GRs:", e); }
        finally { setLoadingGRs(false); }
    };

    // Khi chọn GR → fetch chi tiết → auto-fill kho + items
    const handleSelectGR = async (gr: GROption) => {
        setGoodsReceiptId(gr.id);
        setGoodsReceiptNo(gr.grNo);
        setShowGRModal(false);
        setGrSearch("");
        try {
            const res = await axiosClient.get(`/goods-receipts/${gr.id}`);
            const detail = res.data;
            const { postedByGrItemId, pendingByGrItemId } = await buildGrItemReturnStats(gr.id);
            // Auto-fill kho
            if (detail.warehouseId) {
                setWarehouseId(detail.warehouseId);
                setWarehouseName(detail.warehouseName || "");
            }
            // Auto-fill items từ GR items
            const grItems = detail.items || [];
            setItems(grItems.map((gi: any) => ({
                productId: gi.productId,
                productName: gi.productName || "",
                productSku: gi.productSku || "",
                goodsReceiptItemId: gi.id,
                receivedQty: Number(gi.receivedQty || 0),
                returnedQty: postedByGrItemId.get(Number(gi.id)) || 0,
                pendingQty: pendingByGrItemId.get(Number(gi.id)) || 0,
                availableQty: Math.max(0, Number(gi.receivedQty || 0) - (postedByGrItemId.get(Number(gi.id)) || 0) - (pendingByGrItemId.get(Number(gi.id)) || 0)),
                qty: Math.max(0, Number(gi.receivedQty || 0) - (postedByGrItemId.get(Number(gi.id)) || 0) - (pendingByGrItemId.get(Number(gi.id)) || 0)),
                unitCost: Number(gi.unitCost ?? 0),
                returnAmount: calcReturnAmount(
                    Math.max(0, Number(gi.receivedQty || 0) - (postedByGrItemId.get(Number(gi.id)) || 0) - (pendingByGrItemId.get(Number(gi.id)) || 0)),
                    Number(gi.unitCost ?? 0),
                ),
                vatRate: Number(gi.vatRate ?? 0),
                note: "",
            })));
        } catch (e) {
            console.error("Load GR detail:", e);
            Alert.alert("Lỗi", "Không thể tải chi tiết phiếu nhập.");
        }
    };

    useEffect(() => {
        if (!isEdit) return;
        const loadEdit = async () => {
            try {
                const res = await axiosClient.get(`/supplier-returns/${editId}`);
                const d = res.data;
                setSupplierId(d.supplierId || ""); setSupplierName(d.supplierName || "");
                setGoodsReceiptId(d.goodsReceiptId || null); setGoodsReceiptNo(d.goodsReceiptNo || "");
                setWarehouseId(d.warehouseId || null); setWarehouseName(d.warehouseName || "");
                setNote(d.note || "");
                setDiscountAmount(String(d.discountAmount ?? 0));
                setSurchargeAmount(String(d.surchargeAmount ?? 0));
                setStatus(d.status || "DRAFT");
                setItems((d.items || []).map((item: any) => ({
                    productId: item.productId, productName: item.productName || "",
                    productSku: item.productSku || "", goodsReceiptItemId: item.goodsReceiptItemId,
                    qty: item.qty, returnAmount: item.returnAmount,
                    vatRate: Number(item.vatRate ?? 0), note: item.note || "",
                })));
                // Load GRs for the supplier in edit mode
                if (d.supplierId) {
                    try {
                        const grRes = await axiosClient.get(`/goods-receipts?supplierId=${d.supplierId}&size=100`);
                        setSupplierGRs((grRes.data.content || grRes.data || []).map((gr: any) => ({
                            id: gr.id, grNo: gr.grNo,
                            totalAmountPayable: gr.totalAmountPayable, receiptDate: gr.receiptDate,
                        })));
                    } catch (_) {}
                }

                if (d.goodsReceiptId) {
                    try {
                        const grDetailRes = await axiosClient.get(`/goods-receipts/${d.goodsReceiptId}`);
                        const grItems: any[] = grDetailRes.data?.items || [];
                        const { postedByGrItemId, pendingByGrItemId } = await buildGrItemReturnStats(Number(d.goodsReceiptId), editId);
                        const grItemMap = new Map<number, any>(
                            grItems
                                .filter((it: any) => it?.id != null)
                                .map((it: any) => [Number(it.id), it]),
                        );

                        setItems((prev) =>
                            prev.map((it) => {
                                const ref = it.goodsReceiptItemId ? grItemMap.get(Number(it.goodsReceiptItemId)) : null;
                                if (!ref) return it;
                                const receivedQty = Number(ref.receivedQty || 0);
                                const returnedQty = postedByGrItemId.get(Number(ref.id)) || 0;
                                const pendingQty = pendingByGrItemId.get(Number(ref.id)) || 0;
                                const availableQty = Math.max(0, receivedQty - returnedQty - pendingQty);
                                const qty = Math.max(0, Math.min(Number(it.qty || 0), availableQty));
                                const unitCost = Number(ref.unitCost ?? 0);

                                return {
                                    ...it,
                                    qty,
                                    receivedQty,
                                    returnedQty,
                                    pendingQty,
                                    availableQty,
                                    unitCost,
                                    returnAmount: calcReturnAmount(qty, unitCost),
                                };
                            }),
                        );
                    } catch (_) {}
                }
            } catch (e) { Alert.alert("Lỗi", "Không thể tải phiếu."); }
            finally { setLoading(false); }
        };
        loadEdit();
    }, [editId]);

    const addProduct = (prod: Product) => {
        if (goodsReceiptId) {
            Alert.alert("Không thể thêm", "Đã chọn phiếu nhập gốc, chỉ được trả các sản phẩm trong phiếu nhập đó.");
            return;
        }
        if (items.find(i => i.productId === prod.id)) {
            Alert.alert("Trùng sản phẩm", "Sản phẩm đã có."); setShowProductModal(false); return;
        }
        setItems(prev => [...prev, {
            productId: prod.id, productName: prod.name, productSku: prod.sku,
            qty: 1,
            unitCost: Number(prod.avgCost ?? 0),
            returnAmount: calcReturnAmount(1, Number(prod.avgCost ?? 0)),
            vatRate: 0,
            note: "",
        }]);
        setShowProductModal(false);
    };

    const updateItem = (idx: number, field: keyof LineItem, val: any) => {
        setItems(prev => prev.map((it, i) => {
            if (i !== idx) return it;

            if (field === "qty") {
                const requestedQty = Number(val) || 0;
                const normalizedQty = Math.max(1, Math.floor(requestedQty));
                const maxQty = it.availableQty != null
                    ? Math.max(0, Math.floor(it.availableQty))
                    : it.receivedQty != null
                        ? Math.max(1, Math.floor(it.receivedQty))
                        : undefined;
                const finalQty = maxQty != null ? Math.min(normalizedQty, maxQty) : normalizedQty;

                return {
                    ...it,
                    qty: finalQty,
                    returnAmount: calcReturnAmount(finalQty, it.unitCost),
                };
            }

            if (field === "returnAmount") {
                if (it.goodsReceiptItemId) return it;
                return { ...it, returnAmount: Number(val) || 0 };
            }

            return { ...it, [field]: val };
        }));
    };

    const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

    const handleSubmit = async () => {
        if (!supplierId) { Alert.alert("Thiếu thông tin", "Chọn nhà cung cấp."); return; }
        if (!warehouseId) { Alert.alert("Thiếu thông tin", "Chọn kho."); return; }
        if (items.length === 0) { Alert.alert("Thiếu sản phẩm", "Thêm ít nhất 1 sản phẩm."); return; }

        if (goodsReceiptId) {
            for (const item of items) {
                if (!item.goodsReceiptItemId) {
                    Alert.alert("Không hợp lệ", "Khi có phiếu nhập gốc, mọi sản phẩm trả phải thuộc phiếu nhập đã chọn.");
                    return;
                }
                if (item.availableQty != null && item.qty > item.availableQty) {
                    Alert.alert("Không hợp lệ", `Số lượng trả của ${item.productName} vượt quá số lượng có thể trả (${item.availableQty}).`);
                    return;
                }
            }
        }

        const payload = {
            supplierId, goodsReceiptId: goodsReceiptId || null, warehouseId,
            note: note || null,
            discountAmount: Number(discountAmount) || 0,
            surchargeAmount: Number(surchargeAmount) || 0,
            items: items.map(it => ({
                productId: it.productId, goodsReceiptItemId: it.goodsReceiptItemId || null,
                qty: it.qty, returnAmount: it.returnAmount, note: it.note || null,
            })),
        };
        try {
            setSubmitting(true);
            if (isEdit) {
                await axiosClient.put(`/supplier-returns/${editId}`, payload);
                Alert.alert("Thành công", "Đã cập nhật.");
            } else {
                const res = await axiosClient.post("/supplier-returns", payload);
                Alert.alert("Thành công", `Đã tạo phiếu ${res.data.returnNo}.`);
            }
            navigation.goBack();
        } catch (err: any) {
            Alert.alert("Lỗi", err?.response?.data?.message || "Không thể lưu.");
        } finally { setSubmitting(false); }
    };

    if (loading) return <View style={styles.loadingBox}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;

    const filteredGRs = supplierGRs.filter(gr => gr.grNo.toLowerCase().includes(grSearch.toLowerCase()));

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={22} color={theme.colors.foreground} />
                </TouchableOpacity>
                <Text style={styles.title}>{isEdit ? "Sửa phiếu trả hàng NCC" : "Tạo phiếu trả hàng NCC"}</Text>
            </View>

            {!canEdit && (
                <View style={styles.lockedBanner}>
                    <Feather name="lock" size={14} color="#92400e" />
                    <Text style={styles.lockedText}>Phiếu đã duyệt ({status}). Không thể chỉnh sửa.</Text>
                </View>
            )}

            <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Thông tin chung</Text>

                    {/* Chọn NCC */}
                    <Text style={styles.label}>Nhà cung cấp <Text style={styles.required}>*</Text></Text>
                    <TouchableOpacity style={[styles.picker, !canEdit && styles.pickerDisabled]}
                        onPress={() => canEdit && setShowSupplierModal(true)} disabled={!canEdit}>
                        <Feather name="briefcase" size={16} color={theme.colors.mutedForeground} />
                        <Text style={[styles.pickerText, !supplierId && styles.pickerPlaceholder]}>
                            {supplierName || "Chọn nhà cung cấp..."}
                        </Text>
                        {canEdit && <Feather name="chevron-down" size={16} color={theme.colors.mutedForeground} />}
                    </TouchableOpacity>

                    {/* Chọn GR gốc (tuỳ chọn) */}
                    <Text style={styles.label}>Phiếu nhập gốc - GR (tuỳ chọn)</Text>
                    <TouchableOpacity
                        style={[styles.picker, (!canEdit || !supplierId) && styles.pickerDisabled]}
                        onPress={() => {
                            if (!supplierId) { Alert.alert("", "Vui lòng chọn nhà cung cấp trước."); return; }
                            canEdit && setShowGRModal(true);
                        }}
                        disabled={!canEdit}
                    >
                        <Feather name="file-text" size={16} color={theme.colors.mutedForeground} />
                        {loadingGRs
                            ? <ActivityIndicator size="small" color={theme.colors.primary} style={{ flex: 1 }} />
                            : <Text style={[styles.pickerText, !goodsReceiptId && styles.pickerPlaceholder]}>
                                {goodsReceiptId ? goodsReceiptNo : (supplierId ? "Chọn phiếu nhập hàng..." : "Chọn NCC trước")}
                              </Text>
                        }
                        {canEdit && supplierId && <Feather name="chevron-down" size={16} color={theme.colors.mutedForeground} />}
                        {goodsReceiptId && canEdit && (
                            <TouchableOpacity onPress={() => { setGoodsReceiptId(null); setGoodsReceiptNo(""); setItems([]); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <Feather name="x-circle" size={16} color={theme.colors.mutedForeground} />
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>

                    {/* Kho xuất hàng */}
                    <Text style={styles.label}>Kho xuất hàng trả <Text style={styles.required}>*</Text></Text>
                    <TouchableOpacity style={[styles.picker, !canEdit && styles.pickerDisabled]}
                        onPress={() => canEdit && setShowWarehouseModal(true)} disabled={!canEdit}>
                        <Feather name="archive" size={16} color={theme.colors.mutedForeground} />
                        <Text style={[styles.pickerText, !warehouseId && styles.pickerPlaceholder]}>
                            {warehouseName || "Chọn kho..."}
                        </Text>
                        {canEdit && <Feather name="chevron-down" size={16} color={theme.colors.mutedForeground} />}
                    </TouchableOpacity>

                    <Text style={styles.label}>Ghi chú</Text>
                    <TextInput style={[styles.input, styles.inputMultiline, !canEdit && styles.inputDisabled]}
                        value={note} onChangeText={setNote} placeholder="Ghi chú..." multiline numberOfLines={3} editable={canEdit}
                        placeholderTextColor={theme.colors.mutedForeground} />
                </View>

                {/* Sản phẩm */}
                <View style={styles.card}>
                    <View style={styles.sectionRow}>
                        <Text style={styles.sectionTitle}>Sản phẩm trả NCC</Text>
                        {canEdit && !goodsReceiptId && (
                            <TouchableOpacity style={styles.addBtn} onPress={() => setShowProductModal(true)}>
                                <Feather name="plus" size={16} color="#fff" />
                                <Text style={styles.addBtnText}>Thêm</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    {!!goodsReceiptId && (
                        <Text style={styles.orderBoundHint}>Đã chọn phiếu nhập gốc, chỉ trả các sản phẩm thuộc phiếu nhập này.</Text>
                    )}
                    {items.length === 0 ? (
                        <View style={styles.emptyItems}><Feather name="package" size={32} color={theme.colors.muted} /><Text style={styles.emptyItemsText}>Chưa có sản phẩm.</Text></View>
                    ) : items.map((item, idx) => (
                        <View key={item.productId} style={styles.lineItem}>
                            <View style={styles.lineItemHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.lineItemName}>{item.productName}</Text>
                                    <Text style={styles.lineItemSku}>SKU: {item.productSku}</Text>
                                    {item.receivedQty != null && (
                                        <Text style={styles.lineItemReceived}>
                                            Đã nhập: {item.receivedQty}
                                            {item.pendingQty != null ? `  |  Chờ duyệt: ${item.pendingQty}` : ""}
                                            {item.returnedQty != null ? `  |  Đã trả: ${item.returnedQty}` : ""}
                                            {item.availableQty != null ? `  |  Có thể trả: ${item.availableQty}` : ""}
                                        </Text>
                                    )}
                                </View>
                                {canEdit && <TouchableOpacity onPress={() => removeItem(idx)} style={styles.removeBtn}><Feather name="x" size={18} color={theme.colors.error} /></TouchableOpacity>}
                            </View>
                            <View style={styles.lineItemInputRow}>
                                <View style={styles.lineField}>
                                    <Text style={styles.lineInputLabel}>Số lượng</Text>
                                    <TextInput style={[styles.lineInput, !canEdit && styles.inputDisabled]}
                                        keyboardType="numeric" value={String(item.qty)}
                                        onChangeText={v => updateItem(idx, "qty", Number(v) || 0)} editable={canEdit} />
                                    {item.availableQty != null && (
                                        <Text style={styles.limitHint}>Tối đa: {item.availableQty}</Text>
                                    )}
                                </View>
                                <View style={styles.lineField}>
                                    <Text style={styles.lineInputLabel}>Giá trả về (VND)</Text>
                                    <TextInput style={[styles.lineInput, (!canEdit || !!item.goodsReceiptItemId) && styles.inputDisabled]}
                                        keyboardType="numeric" value={String(item.returnAmount)}
                                        onChangeText={v => updateItem(idx, "returnAmount", Number(v) || 0)} editable={canEdit && !item.goodsReceiptItemId} />
                                </View>
                                {item.vatRate > 0 && (
                                    <View style={{ alignItems: "flex-end", justifyContent: "flex-end" }}>
                                        <View style={styles.vatBadge}>
                                            <Text style={styles.vatBadgeText}>VAT {item.vatRate}%</Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                            <Text style={[styles.lineInputLabel, { marginTop: 8 }]}>Ghi chú dòng</Text>
                            <TextInput style={[styles.lineInput, !canEdit && styles.inputDisabled]}
                                value={item.note} onChangeText={v => updateItem(idx, "note", v)} editable={canEdit}
                                placeholder="(tuỳ chọn)" placeholderTextColor={theme.colors.mutedForeground} />
                        </View>
                    ))}
                </View>

                <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tiền hàng trả:</Text>
                        <Text style={styles.summaryValue}>{grossReturn.toLocaleString("vi-VN")} đ</Text>
                    </View>
                    {vatReturn > 0 && (
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Thuế VAT:</Text>
                            <Text style={[styles.summaryValue, { color: "#f59e0b" }]}>+ {vatReturn.toLocaleString("vi-VN")} đ</Text>
                        </View>
                    )}
                    <View style={[styles.summaryRow, styles.summaryTotal]}>
                        <Text style={styles.summaryTotalLabel}>Tổng trả NCC:</Text>
                        <Text style={styles.summaryTotalValue}>{totalReturn.toLocaleString("vi-VN")} đ</Text>
                    </View>
                </View>
            </ScrollView>

            {canEdit && (
                <View style={styles.footer}>
                    <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={submitting}>
                        {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Feather name="save" size={18} color="#fff" />}
                        <Text style={styles.submitBtnText}>{submitting ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo phiếu trả NCC"}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Supplier Modal */}
            <Modal visible={showSupplierModal} transparent animationType="slide" onRequestClose={() => setShowSupplierModal(false)}>
                <View style={styles.modalOverlay}><View style={styles.modalBox}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Chọn nhà cung cấp</Text>
                        <TouchableOpacity onPress={() => setShowSupplierModal(false)}><Feather name="x" size={22} color={theme.colors.foreground} /></TouchableOpacity>
                    </View>
                    <TextInput style={styles.modalSearch} placeholder="Tìm NCC..." value={supplierSearch}
                        onChangeText={setSupplierSearch} placeholderTextColor={theme.colors.mutedForeground} />
                    <FlatList
                        data={suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()))}
                        keyExtractor={s => s.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.modalItem} onPress={() => handleSelectSupplier(item)}>
                                <Text style={styles.modalItemName}>{item.name}</Text>
                                {item.phone && <Text style={styles.modalItemSub}>{item.phone}</Text>}
                            </TouchableOpacity>
                        )}
                    />
                </View></View>
            </Modal>

            {/* GR Picker Modal */}
            <Modal visible={showGRModal} transparent animationType="slide" onRequestClose={() => setShowGRModal(false)}>
                <View style={styles.modalOverlay}><View style={styles.modalBox}>
                    <View style={styles.modalHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.modalTitle}>Chọn phiếu nhập hàng</Text>
                            <Text style={styles.modalSubtitle}>NCC: {supplierName}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowGRModal(false)}><Feather name="x" size={22} color={theme.colors.foreground} /></TouchableOpacity>
                    </View>
                    <TextInput style={styles.modalSearch} placeholder="Tìm mã GR..." value={grSearch}
                        onChangeText={setGrSearch} placeholderTextColor={theme.colors.mutedForeground} />
                    {filteredGRs.length === 0 ? (
                        <View style={styles.emptyItems}>
                            <Feather name="inbox" size={28} color={theme.colors.muted} />
                            <Text style={styles.emptyItemsText}>
                                {supplierGRs.length === 0 ? "NCC chưa có phiếu nhập hàng." : "Không tìm thấy phiếu."}
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredGRs}
                            keyExtractor={gr => String(gr.id)}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.modalItem} onPress={() => handleSelectGR(item)}>
                                    <Text style={styles.modalItemName}>{item.grNo}</Text>
                                    <Text style={styles.modalItemSub}>
                                        {item.totalAmountPayable != null ? `${Number(item.totalAmountPayable).toLocaleString("vi-VN")} đ` : ""}
                                        {item.receiptDate ? ` · ${item.receiptDate}` : ""}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View></View>
            </Modal>

            {/* Warehouse Modal */}
            <Modal visible={showWarehouseModal} transparent animationType="slide" onRequestClose={() => setShowWarehouseModal(false)}>
                <View style={styles.modalOverlay}><View style={styles.modalBox}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Chọn kho hàng</Text>
                        <TouchableOpacity onPress={() => setShowWarehouseModal(false)}><Feather name="x" size={22} color={theme.colors.foreground} /></TouchableOpacity>
                    </View>
                    <FlatList data={warehouses} keyExtractor={w => String(w.id)} renderItem={({ item }) => (
                        <TouchableOpacity style={styles.modalItem} onPress={() => { setWarehouseId(item.id); setWarehouseName(item.name); setShowWarehouseModal(false); }}>
                            <Text style={styles.modalItemName}>{item.name}</Text>
                            {item.code && <Text style={styles.modalItemSub}>Mã: {item.code}</Text>}
                        </TouchableOpacity>
                    )} />
                </View></View>
            </Modal>

            {/* Product Modal */}
            <Modal visible={showProductModal} transparent animationType="slide" onRequestClose={() => setShowProductModal(false)}>
                <View style={styles.modalOverlay}><View style={styles.modalBox}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Thêm sản phẩm</Text>
                        <TouchableOpacity onPress={() => setShowProductModal(false)}><Feather name="x" size={22} color={theme.colors.foreground} /></TouchableOpacity>
                    </View>
                    <TextInput style={styles.modalSearch} placeholder="Tìm tên, SKU..." value={productSearch}
                        onChangeText={setProductSearch} placeholderTextColor={theme.colors.mutedForeground} />
                    <FlatList
                        data={products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase()))}
                        keyExtractor={p => String(p.id)}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.modalItem} onPress={() => addProduct(item)}>
                                <Text style={styles.modalItemName}>{item.name}</Text>
                                <Text style={styles.modalItemSub}>SKU: {item.sku}</Text>
                            </TouchableOpacity>
                        )}
                    />
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
    sectionTitle: { fontSize: 15, fontWeight: "700", color: theme.colors.foreground, marginBottom: 14 },
    sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
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
    emptyItemsText: { color: theme.colors.mutedForeground, fontSize: 13, textAlign: "center" },
    lineItem: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 12, marginBottom: 10, backgroundColor: theme.colors.background },
    lineItemHeader: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 10 },
    lineItemName: { fontSize: 14, fontWeight: "600", color: theme.colors.foreground, flex: 1 },
    lineItemSku: { fontSize: 12, color: theme.colors.mutedForeground, marginTop: 2 },
    lineItemReceived: { fontSize: 12, color: theme.colors.primary, marginTop: 4, fontWeight: "600", lineHeight: 18 },
    removeBtn: { padding: 4 },
    vatBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: "#fef9c3" },
    vatBadgeText: { fontSize: 11, fontWeight: "700", color: "#92400e" },
    lineItemInputRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", flexWrap: "wrap" },
    lineField: { flex: 1, minWidth: 220 },
    lineInputLabel: { fontSize: 11, color: theme.colors.mutedForeground, marginBottom: 4 },
    lineInput: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: theme.colors.foreground, backgroundColor: theme.colors.surface, width: "100%" },
    limitHint: { fontSize: 11, color: theme.colors.mutedForeground, marginTop: 4 },
    orderBoundHint: { fontSize: 12, color: theme.colors.primary, marginBottom: 10, marginTop: -6 },
    summaryCard: { margin: 16, marginTop: 12, borderRadius: 12, padding: 16, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
    summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    summaryLabel: { color: theme.colors.mutedForeground, fontSize: 14 },
    summaryValue: { color: theme.colors.foreground, fontSize: 14 },
    summaryTotal: { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12, marginTop: 4 },
    summaryTotalLabel: { fontSize: 16, fontWeight: "700", color: theme.colors.foreground },
    summaryTotalValue: { fontSize: 18, fontWeight: "700", color: theme.colors.primary },
    footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.border },
    submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: theme.colors.primary, borderRadius: 12, paddingVertical: 16 },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modalBox: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "75%" },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
    modalTitle: { fontSize: 17, fontWeight: "700", color: theme.colors.foreground },
    modalSubtitle: { fontSize: 13, color: theme.colors.mutedForeground, marginTop: 2 },
    modalSearch: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, padding: 12, fontSize: 14, color: theme.colors.foreground, marginBottom: 10 },
    modalItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    modalItemName: { fontSize: 14, fontWeight: "600", color: theme.colors.foreground },
    modalItemSub: { fontSize: 12, color: theme.colors.mutedForeground, marginTop: 2 },
});

export default SupplierReturnFormScreen;
