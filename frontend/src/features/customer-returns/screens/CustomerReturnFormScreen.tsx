import React, { useEffect, useState } from "react";
import {
    View, Text, TextInput, ScrollView, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator, FlatList, Modal,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { axiosClient } from "../../../api/axiosClient";
import { theme } from "../../../utils/theme";
import { showAlert } from "../../../utils/alerts";

interface Customer { id: string; name: string; phone?: string; }
interface Warehouse { id: number; name: string; code?: string; }
interface Product { id: number; name: string; sku: string; salePrice?: number; }
interface OrderOption { id: number; orderNo: string; netAmount?: number; orderTime?: string; warehouseId?: number; warehouseName?: string; }

interface LineItem {
    productId: number;
    productName: string;
    productSku: string;
    orderItemId?: number;
    qty: number;
    refundAmount: number;
    purchasedQty?: number;
    unitPrice?: number;
    lineRevenue?: number;
    returnedQty?: number;
    pendingQty?: number;
    availableQty?: number;
    postedRefund?: number;
    pendingRefund?: number;
    availableRefund?: number;
}

const CustomerReturnFormScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const editId: number | undefined = route.params?.id;
    const isEdit = !!editId;

    const [customerId, setCustomerId]     = useState<string>("");
    const [customerName, setCustomerName] = useState<string>("");
    const [orderId, setOrderId]           = useState<number | null>(null);
    const [orderNo, setOrderNo]           = useState<string>("");
    const [warehouseId, setWarehouseId]   = useState<number | null>(null);
    const [warehouseName, setWarehouseName] = useState<string>("");
    const [note, setNote]                 = useState<string>("");
    const [discountAmount, setDiscountAmount]   = useState<string>("0");
    const [surchargeAmount, setSurchargeAmount] = useState<string>("0");
    const [items, setItems]               = useState<LineItem[]>([]);
    const [status, setStatus]             = useState<string>("DRAFT");

    const [customers, setCustomers]       = useState<Customer[]>([]);
    const [warehouses, setWarehouses]     = useState<Warehouse[]>([]);
    const [products, setProducts]         = useState<Product[]>([]);
    const [customerOrders, setCustomerOrders] = useState<OrderOption[]>([]);

    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading]       = useState(isEdit);
    const [loadingOrders, setLoadingOrders] = useState(false);

    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showOrderModal, setShowOrderModal]       = useState(false);
    const [showWarehouseModal, setShowWarehouseModal] = useState(false);
    const [showProductModal, setShowProductModal]   = useState(false);
    const [customerSearch, setCustomerSearch] = useState("");
    const [orderSearch, setOrderSearch]       = useState("");
    const [productSearch, setProductSearch]   = useState("");

    const totalRefund = items.reduce((s, i) => s + i.refundAmount, 0);
    const canEdit     = !isEdit || status === "DRAFT";
    const hasReturnableItems = items.some((item) => (item.availableQty ?? item.purchasedQty ?? 1) > 0 || !orderId);
    const submitItems = orderId
        ? items.filter((item) => (item.availableQty ?? 0) > 0)
        : items;

    const calcRefundAmount = (qty: number, unitPrice?: number) => {
        const safeQty = Number.isFinite(qty) ? Math.max(0, qty) : 0;
        const safeUnitPrice = Number.isFinite(unitPrice) ? Number(unitPrice) : 0;
        return Math.round(safeQty * safeUnitPrice);
    };

    const calcOrderItemRefundAmount = (qty: number, purchasedQty?: number, lineRevenue?: number, fallbackUnitPrice?: number) => {
        const safeQty = Number.isFinite(qty) ? Math.max(0, qty) : 0;
        const safePurchasedQty = Number.isFinite(purchasedQty) ? Number(purchasedQty) : 0;
        const safeLineRevenue = Number.isFinite(lineRevenue) ? Number(lineRevenue) : null;

        if (safeLineRevenue != null && safePurchasedQty > 0) {
            return Math.round((safeLineRevenue * safeQty) / safePurchasedQty);
        }

        return calcRefundAmount(safeQty, fallbackUnitPrice);
    };

    const buildOrderItemReturnStats = async (selectedOrderId: number, excludedReturnId?: number) => {
        const postedByOrderItemId = new Map<number, number>();
        const pendingByOrderItemId = new Map<number, number>();
        const postedRefundByOrderItemId = new Map<number, number>();
        const pendingRefundByOrderItemId = new Map<number, number>();

        const [postedRes, draftRes] = await Promise.all([
            axiosClient.get("/customer-returns?status=POSTED&page=0&size=500&sortBy=id&direction=desc"),
            axiosClient.get("/customer-returns?status=DRAFT&page=0&size=500&sortBy=id&direction=desc"),
        ]);
        const postedRows: any[] = postedRes.data?.content || postedRes.data || [];
        const draftRows: any[] = draftRes.data?.content || draftRes.data || [];

        const postedForOrder = postedRows.filter((row) => Number(row?.orderId) === Number(selectedOrderId));
        const draftForOrder = draftRows.filter(
            (row) => Number(row?.orderId) === Number(selectedOrderId) && Number(row?.id) !== Number(excludedReturnId || 0),
        );

        const collectMap = async (
            rows: any[],
            qtyMap: Map<number, number>,
            refundMap: Map<number, number>,
        ) => {
            await Promise.all(
                rows.map(async (row) => {
                    const detailRes = await axiosClient.get(`/customer-returns/${row.id}`);
                    const detailItems: any[] = detailRes.data?.items || [];
                    detailItems.forEach((it) => {
                        const orderItemId = Number(it?.orderItemId);
                        if (!Number.isFinite(orderItemId) || orderItemId <= 0) return;
                        const qty = Number(it?.qty || 0);
                        const refund = Number(it?.refundAmount || 0);
                        qtyMap.set(orderItemId, (qtyMap.get(orderItemId) || 0) + qty);
                        refundMap.set(orderItemId, (refundMap.get(orderItemId) || 0) + refund);
                    });
                }),
            );
        };

        await collectMap(postedForOrder, postedByOrderItemId, postedRefundByOrderItemId);
        await collectMap(draftForOrder, pendingByOrderItemId, pendingRefundByOrderItemId);

        return {
            postedByOrderItemId,
            pendingByOrderItemId,
            postedRefundByOrderItemId,
            pendingRefundByOrderItemId,
        };
    };

    useEffect(() => {
        const load = async () => {
            try {
                const [cRes, wRes, pRes] = await Promise.all([
                    axiosClient.get("/customers?size=200"),
                    axiosClient.get("/warehouses?size=100"),
                    axiosClient.get("/products?size=500&isActive=true"),
                ]);
                setCustomers(cRes.data.content || cRes.data || []);
                setWarehouses(wRes.data.content || wRes.data || []);
                setProducts(pRes.data.content || pRes.data || []);
            } catch (e) { console.error(e); }
        };
        load();
    }, []);

    // Khi chọn khách hàng → load danh sách đơn hàng của KH
    const handleSelectCustomer = async (customer: Customer) => {
        setCustomerId(customer.id);
        setCustomerName(customer.name);
        setShowCustomerModal(false);
        setCustomerSearch("");
        // Reset order selection & items
        setOrderId(null);
        setOrderNo("");
        setItems([]);
        setCustomerOrders([]);
        // Load orders của khách này
        setLoadingOrders(true);
        try {
            const res = await axiosClient.get(`/orders?customerId=${customer.id}&size=100`);
            setCustomerOrders((res.data.content || res.data || []).map((o: any) => ({
                id: o.id,
                orderNo: o.orderNo,
                netAmount: o.netAmount,
                orderTime: o.orderTime,
            })));
        } catch (e) { console.error("Load customer orders:", e); }
        finally { setLoadingOrders(false); }
    };

    // Khi chọn đơn hàng → fetch chi tiết → auto-fill kho + items
    const handleSelectOrder = async (order: OrderOption) => {
        setOrderId(order.id);
        setOrderNo(order.orderNo);
        setShowOrderModal(false);
        setOrderSearch("");
        try {
            const res = await axiosClient.get(`/orders/${order.id}`);
            const detail = res.data;
            const {
                postedByOrderItemId,
                pendingByOrderItemId,
                postedRefundByOrderItemId,
                pendingRefundByOrderItemId,
            } = await buildOrderItemReturnStats(order.id);

            // Auto-fill kho từ đơn hàng
            if (detail.warehouseId) {
                setWarehouseId(detail.warehouseId);
                setWarehouseName(detail.warehouseName || "");
            }
            // Auto-fill items từ order items
            const orderItems = detail.items || [];
            setItems(orderItems.map((oi: any) => {
                const purchasedQty = Number(oi.qty || 0);
                const returnedQty = postedByOrderItemId.get(Number(oi.id)) || 0;
                const pendingQty = pendingByOrderItemId.get(Number(oi.id)) || 0;
                const availableQty = Math.max(0, purchasedQty - returnedQty - pendingQty);
                const unitPrice = Number(oi.salePrice ?? 0);
                const lineRevenue = Number(oi.lineRevenue ?? 0);
                const postedRefund = postedRefundByOrderItemId.get(Number(oi.id)) || 0;
                const pendingRefund = pendingRefundByOrderItemId.get(Number(oi.id)) || 0;
                const availableRefund = Math.max(0, lineRevenue - postedRefund - pendingRefund);
                const initialQty = availableQty;
                const proposedRefund = calcOrderItemRefundAmount(initialQty, purchasedQty, lineRevenue, unitPrice);

                return {
                    productId: oi.productId,
                    productName: oi.productName || "",
                    productSku: oi.productSku || "",
                    orderItemId: oi.id,
                    qty: initialQty,
                    purchasedQty,
                    returnedQty,
                    pendingQty,
                    availableQty,
                    unitPrice,
                    lineRevenue,
                    postedRefund,
                    pendingRefund,
                    availableRefund,
                    refundAmount: Math.min(proposedRefund, availableRefund),
                };
            }));
        } catch (e) {
            console.error("Load order detail:", e);
            showAlert("Lỗi", "Không thể tải chi tiết đơn hàng.");
        }
    };

    useEffect(() => {
        if (!isEdit) return;
        const loadEdit = async () => {
            try {
                const res = await axiosClient.get(`/customer-returns/${editId}`);
                const d = res.data;
                setCustomerId(d.customerId || ""); setCustomerName(d.customerName || "");
                setOrderId(d.orderId || null); setOrderNo(d.orderNo || "");
                setWarehouseId(d.warehouseId || null); setWarehouseName(d.warehouseName || "");
                setNote(d.note || "");
                setDiscountAmount(String(d.discountAmount ?? 0));
                setSurchargeAmount(String(d.surchargeAmount ?? 0));
                setStatus(d.status || "DRAFT");
                setItems((d.items || []).map((item: any) => ({
                    productId: item.productId, productName: item.productName || "",
                    productSku: item.productSku || "", orderItemId: item.orderItemId,
                    qty: item.qty, refundAmount: item.refundAmount,
                })));
                // Load orders of the customer for edit mode too
                if (d.customerId) {
                    try {
                        const oRes = await axiosClient.get(`/orders?customerId=${d.customerId}&size=100`);
                        setCustomerOrders((oRes.data.content || oRes.data || []).map((o: any) => ({
                            id: o.id, orderNo: o.orderNo, netAmount: o.netAmount, orderTime: o.orderTime,
                        })));
                    } catch (_) {}
                }

                if (d.orderId) {
                    try {
                        const orderRes = await axiosClient.get(`/orders/${d.orderId}`);
                        const orderItems: any[] = orderRes.data?.items || [];
                        const {
                            postedByOrderItemId,
                            pendingByOrderItemId,
                            postedRefundByOrderItemId,
                            pendingRefundByOrderItemId,
                        } = await buildOrderItemReturnStats(Number(d.orderId), editId);
                        const orderItemMap = new Map<number, any>(
                            orderItems
                                .filter((oi: any) => oi?.id != null)
                                .map((oi: any) => [Number(oi.id), oi]),
                        );

                        setItems((prev) =>
                            prev.map((it) => {
                                const ref = it.orderItemId ? orderItemMap.get(Number(it.orderItemId)) : null;
                                if (!ref) return it;
                                const unitPrice = Number(ref.salePrice ?? 0);
                                const purchasedQty = Number(ref.qty ?? it.qty ?? 0);
                                const lineRevenue = Number(ref.lineRevenue ?? 0);
                                const returnedQty = postedByOrderItemId.get(Number(ref.id)) || 0;
                                const pendingQty = pendingByOrderItemId.get(Number(ref.id)) || 0;
                                const availableQty = Math.max(0, purchasedQty - returnedQty - pendingQty);
                                const currentQty = Number(it.qty || 0);
                                const qty = Math.max(0, Math.min(currentQty, availableQty));
                                const postedRefund = postedRefundByOrderItemId.get(Number(ref.id)) || 0;
                                const pendingRefund = pendingRefundByOrderItemId.get(Number(ref.id)) || 0;
                                const availableRefund = Math.max(0, lineRevenue - postedRefund - pendingRefund);
                                const proposedRefund = calcOrderItemRefundAmount(qty, purchasedQty, lineRevenue, unitPrice);
                                return {
                                    ...it,
                                    qty,
                                    purchasedQty,
                                    returnedQty,
                                    pendingQty,
                                    availableQty,
                                    unitPrice,
                                    lineRevenue,
                                    postedRefund,
                                    pendingRefund,
                                    availableRefund,
                                    refundAmount: Math.min(proposedRefund, availableRefund),
                                };
                            }),
                        );
                    } catch (_) {}
                }
            } catch (e) { showAlert("Lỗi", "Không thể tải phiếu."); }
            finally { setLoading(false); }
        };
        loadEdit();
    }, [editId]);

    const addProduct = (prod: Product) => {
        if (orderId) {
            showAlert("Không thể thêm", "Đã chọn đơn hàng gốc, chỉ được trả các sản phẩm trong đơn này.");
            return;
        }
        if (items.find(i => i.productId === prod.id)) {
            showAlert("Trùng sản phẩm", "Sản phẩm đã có.");
            setShowProductModal(false); return;
        }
        setItems(prev => [...prev, {
            productId: prod.id, productName: prod.name, productSku: prod.sku,
            qty: 1,
            unitPrice: Number(prod.salePrice ?? 0),
            refundAmount: calcRefundAmount(1, Number(prod.salePrice ?? 0)),
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
                    : it.purchasedQty != null
                        ? Math.max(1, Math.floor(it.purchasedQty))
                        : undefined;
                const finalQty = maxQty != null ? Math.min(normalizedQty, maxQty) : normalizedQty;

                return {
                    ...it,
                    qty: finalQty,
                    refundAmount: it.orderItemId
                        ? Math.min(
                            calcOrderItemRefundAmount(finalQty, it.purchasedQty, it.lineRevenue, it.unitPrice),
                            Math.max(0, Number(it.availableRefund ?? Number.MAX_SAFE_INTEGER)),
                        )
                        : calcRefundAmount(finalQty, it.unitPrice),
                };
            }

            if (field === "refundAmount") {
                // For order-based return, refund amount follows qty * unitPrice.
                if (it.orderItemId) return it;
                return { ...it, refundAmount: Number(val) || 0 };
            }

            return { ...it, [field]: val };
        }));
    };

    const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

    const handleSubmit = async () => {
        if (!customerId) { showAlert("Thiếu thông tin", "Chọn khách hàng."); return; }
        if (!warehouseId) { showAlert("Thiếu thông tin", "Chọn kho nhận hàng trả."); return; }
        if (items.length === 0) { showAlert("Thiếu sản phẩm", "Thêm ít nhất 1 sản phẩm."); return; }

        if (orderId) {
            const returnableItems = submitItems;

            if (returnableItems.length === 0) {
                showAlert("Không thể tạo phiếu", "Tất cả sản phẩm trong đơn hàng này đã đạt tối đa yêu cầu trả.");
                return;
            }

            for (const item of returnableItems) {
                if (!item.orderItemId) {
                    showAlert("Không hợp lệ", "Khi có đơn hàng gốc, mọi sản phẩm trả phải thuộc đơn hàng đã chọn.");
                    return;
                }
                if (item.availableQty != null && item.qty > item.availableQty) {
                    showAlert("Không hợp lệ", `Số lượng trả của ${item.productName} vượt quá số lượng có thể trả (${item.availableQty}).`);
                    return;
                }
            }
        }

        const payload = {
            customerId, orderId: orderId || null, warehouseId,
            note: note || null,
            discountAmount: Number(discountAmount) || 0,
            surchargeAmount: Number(surchargeAmount) || 0,
            items: submitItems.map(it => ({
                productId: it.productId, orderItemId: it.orderItemId || null,
                qty: it.qty,
                refundAmount: it.orderItemId
                    ? Math.min(
                        calcOrderItemRefundAmount(it.qty, it.purchasedQty, it.lineRevenue, it.unitPrice),
                        Math.max(0, Number(it.availableRefund ?? Number.MAX_SAFE_INTEGER)),
                    )
                    : it.refundAmount,
            })),
        };
        try {
            setSubmitting(true);
            if (isEdit) {
                await axiosClient.put(`/customer-returns/${editId}`, payload);
                showAlert("Thành công", "Đã cập nhật phiếu.");
            } else {
                const res = await axiosClient.post("/customer-returns", payload);
                showAlert("Thành công", `Đã tạo phiếu ${res.data.returnNo}.`);
            }
            navigation.goBack();
        } catch (err: any) {
            const responseData = err?.response?.data;
            const statusText = err?.response?.status ? `HTTP ${err.response.status}` : "";
            const rawDetail = typeof responseData === "object" ? JSON.stringify(responseData) : String(responseData || "");
            const detailMessage = typeof responseData === "string"
                ? responseData
                : responseData?.message || responseData?.error || responseData?.fieldErrors?.items || "Không thể lưu phiếu.";
            showAlert("Lỗi", [statusText, detailMessage, rawDetail].filter(Boolean).join("\n"));
        } finally { setSubmitting(false); }
    };

    if (loading) return <View style={styles.loadingBox}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;

    const filteredOrders = customerOrders.filter(o =>
        o.orderNo.toLowerCase().includes(orderSearch.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={22} color={theme.colors.foreground} />
                </TouchableOpacity>
                <Text style={styles.title}>{isEdit ? "Sửa phiếu trả hàng KH" : "Tạo phiếu trả hàng KH"}</Text>
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

                    {/* Chọn khách hàng */}
                    <Text style={styles.label}>Khách hàng <Text style={styles.required}>*</Text></Text>
                    <TouchableOpacity style={[styles.picker, !canEdit && styles.pickerDisabled]}
                        onPress={() => canEdit && setShowCustomerModal(true)} disabled={!canEdit}>
                        <Feather name="user" size={16} color={theme.colors.mutedForeground} />
                        <Text style={[styles.pickerText, !customerId && styles.pickerPlaceholder]}>
                            {customerName || "Chọn khách hàng..."}
                        </Text>
                        {canEdit && <Feather name="chevron-down" size={16} color={theme.colors.mutedForeground} />}
                    </TouchableOpacity>

                    {/* Chọn đơn hàng gốc (tuỳ chọn) */}
                    <Text style={styles.label}>Đơn hàng gốc (tuỳ chọn)</Text>
                    <TouchableOpacity
                        style={[styles.picker, (!canEdit || !customerId) && styles.pickerDisabled]}
                        onPress={() => {
                            if (!customerId) { showAlert("", "Vui lòng chọn khách hàng trước."); return; }
                            canEdit && setShowOrderModal(true);
                        }}
                        disabled={!canEdit}
                    >
                        <Feather name="shopping-bag" size={16} color={theme.colors.mutedForeground} />
                        {loadingOrders
                            ? <ActivityIndicator size="small" color={theme.colors.primary} style={{ flex: 1 }} />
                            : <Text style={[styles.pickerText, !orderId && styles.pickerPlaceholder]}>
                                {orderId ? orderNo : (customerId ? "Chọn đơn hàng..." : "Chọn khách hàng trước")}
                              </Text>
                        }
                        {canEdit && customerId && <Feather name="chevron-down" size={16} color={theme.colors.mutedForeground} />}
                        {orderId && canEdit && (
                            <TouchableOpacity onPress={() => { setOrderId(null); setOrderNo(""); setItems([]); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <Feather name="x-circle" size={16} color={theme.colors.mutedForeground} />
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>

                    {/* Kho nhận hàng trả */}
                    <Text style={styles.label}>Kho nhận hàng trả <Text style={styles.required}>*</Text></Text>
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
                        <Text style={styles.sectionTitle}>Sản phẩm trả lại</Text>
                        {canEdit && !orderId && (
                            <TouchableOpacity style={styles.addBtn} onPress={() => setShowProductModal(true)}>
                                <Feather name="plus" size={16} color="#fff" />
                                <Text style={styles.addBtnText}>Thêm</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    {!!orderId && (
                        <Text style={styles.orderBoundHint}>Đã chọn đơn hàng gốc, chỉ trả các sản phẩm thuộc đơn hàng này.</Text>
                    )}
                    {!!orderId && !hasReturnableItems && (
                        <View style={styles.zeroItemBanner}>
                            <Feather name="alert-circle" size={14} color="#991b1b" />
                            <Text style={styles.zeroItemBannerText}>
                                Tất cả sản phẩm trong đơn này đã đạt tối đa yêu cầu trả, không thể trả thêm.
                            </Text>
                        </View>
                    )}
                    {items.length === 0 ? (
                        <View style={styles.emptyItems}>
                            <Feather name="package" size={32} color={theme.colors.muted} />
                            <Text style={styles.emptyItemsText}>Chưa có sản phẩm.</Text>
                        </View>
                    ) : items.map((item, idx) => (
                        <View key={item.productId} style={styles.lineItem}>
                            <View style={styles.lineItemHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.lineItemName}>{item.productName}</Text>
                                    <Text style={styles.lineItemSku}>SKU: {item.productSku}</Text>
                                    {item.purchasedQty != null && (
                                        <Text style={styles.lineItemPurchased}>
                                            Đã mua: {item.purchasedQty}
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
                                    <Text style={styles.lineInputLabel}>Số lượng trả</Text>
                                    {(item.availableQty ?? 0) <= 0 ? (
                                        <View style={styles.zeroItemNoticeBox}>
                                            <Feather name="slash" size={14} color="#991b1b" />
                                            <Text style={styles.zeroItemNoticeText}>
                                                Sản phẩm này đã đạt tối đa yêu cầu trả, không thể trả sản phẩm này.
                                            </Text>
                                        </View>
                                    ) : (
                                        <>
                                            <TextInput style={[styles.lineInput, !canEdit && styles.inputDisabled]}
                                                keyboardType="numeric" value={String(item.qty)}
                                                onChangeText={v => updateItem(idx, "qty", Number(v) || 0)} editable={canEdit} />
                                            {item.availableQty != null && (
                                                <Text style={styles.limitHint}>Tối đa: {item.availableQty}</Text>
                                            )}
                                        </>
                                    )}
                                </View>
                                <View style={styles.lineField}>
                                    <Text style={styles.lineInputLabel}>Số tiền hoàn (VND)</Text>
                                    <TextInput style={[styles.lineInput, (!canEdit || !!item.orderItemId || (item.availableQty ?? 0) <= 0) && styles.inputDisabled]}
                                        keyboardType="numeric" value={String(item.refundAmount)}
                                        onChangeText={v => updateItem(idx, "refundAmount", Number(v) || 0)} editable={canEdit && !item.orderItemId && (item.availableQty ?? 0) > 0} />
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.summaryCard}>
                    <View style={[styles.summaryRow, styles.summaryTotal]}>
                        <Text style={styles.summaryTotalLabel}>Tổng hoàn trả:</Text>
                        <Text style={styles.summaryTotalValue}>{totalRefund.toLocaleString("vi-VN")} đ</Text>
                    </View>
                </View>
            </ScrollView>

            {canEdit && (
                <View style={styles.footer}>
                    <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={submitting}>
                        {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Feather name="save" size={18} color="#fff" />}
                        <Text style={styles.submitBtnText}>{submitting ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo phiếu trả hàng KH"}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Customer Modal */}
            <Modal visible={showCustomerModal} transparent animationType="slide" onRequestClose={() => setShowCustomerModal(false)}>
                <View style={styles.modalOverlay}><View style={styles.modalBox}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Chọn khách hàng</Text>
                        <TouchableOpacity onPress={() => setShowCustomerModal(false)}><Feather name="x" size={22} color={theme.colors.foreground} /></TouchableOpacity>
                    </View>
                    <TextInput style={styles.modalSearch} placeholder="Tìm tên, SĐT..." value={customerSearch}
                        onChangeText={setCustomerSearch} placeholderTextColor={theme.colors.mutedForeground} />
                    <FlatList
                        data={customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.phone || "").includes(customerSearch))}
                        keyExtractor={c => c.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.modalItem} onPress={() => handleSelectCustomer(item)}>
                                <Text style={styles.modalItemName}>{item.name}</Text>
                                {item.phone && <Text style={styles.modalItemSub}>{item.phone}</Text>}
                            </TouchableOpacity>
                        )}
                    />
                </View></View>
            </Modal>

            {/* Order Picker Modal */}
            <Modal visible={showOrderModal} transparent animationType="slide" onRequestClose={() => setShowOrderModal(false)}>
                <View style={styles.modalOverlay}><View style={styles.modalBox}>
                    <View style={styles.modalHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.modalTitle}>Chọn đơn hàng</Text>
                            <Text style={styles.modalSubtitle}>KH: {customerName}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowOrderModal(false)}><Feather name="x" size={22} color={theme.colors.foreground} /></TouchableOpacity>
                    </View>
                    <TextInput style={styles.modalSearch} placeholder="Tìm mã đơn hàng..." value={orderSearch}
                        onChangeText={setOrderSearch} placeholderTextColor={theme.colors.mutedForeground} />
                    {filteredOrders.length === 0 ? (
                        <View style={styles.emptyItems}>
                            <Feather name="inbox" size={28} color={theme.colors.muted} />
                            <Text style={styles.emptyItemsText}>
                                {customerOrders.length === 0 ? "Khách hàng chưa có đơn hàng nào." : "Không tìm thấy đơn hàng."}
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredOrders}
                            keyExtractor={o => String(o.id)}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.modalItem} onPress={() => handleSelectOrder(item)}>
                                    <Text style={styles.modalItemName}>{item.orderNo}</Text>
                                    {item.netAmount != null && (
                                        <Text style={styles.modalItemSub}>
                                            {Number(item.netAmount).toLocaleString("vi-VN")} đ
                                            {item.orderTime ? ` · ${new Date(item.orderTime).toLocaleDateString("vi-VN")}` : ""}
                                        </Text>
                                    )}
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
                                <Text style={styles.modalItemSub}>SKU: {item.sku}{item.salePrice ? ` · ${Number(item.salePrice).toLocaleString("vi-VN")} đ` : ""}</Text>
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
    lineItemPurchased: { fontSize: 12, color: theme.colors.primary, marginTop: 4, fontWeight: "600", lineHeight: 18 },
    removeBtn: { padding: 4 },
    lineItemInputRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", flexWrap: "wrap" },
    lineField: { flex: 1, minWidth: 220 },
    lineInputLabel: { fontSize: 11, color: theme.colors.mutedForeground, marginBottom: 4 },
    lineInput: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: theme.colors.foreground, backgroundColor: theme.colors.surface, width: "100%" },
    limitHint: { fontSize: 11, color: theme.colors.mutedForeground, marginTop: 4 },
    orderBoundHint: { fontSize: 12, color: theme.colors.primary, marginBottom: 10, marginTop: -6 },
    zeroItemBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fef2f2", borderColor: "#fecaca", borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
    zeroItemBannerText: { flex: 1, color: "#991b1b", fontSize: 12, fontWeight: "600", lineHeight: 18 },
    zeroItemNoticeBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fef2f2", borderColor: "#fecaca", borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10, minHeight: 44 },
    zeroItemNoticeText: { flex: 1, color: "#991b1b", fontSize: 12, fontWeight: "600", lineHeight: 18 },
    summaryCard: { margin: 16, marginTop: 12, borderRadius: 12, padding: 16, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
    summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
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

export default CustomerReturnFormScreen;
