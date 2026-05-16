import React, { useEffect, useState } from "react";
import {
    View,
    ScrollView,
    StyleSheet,
    useWindowDimensions,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    Image,
    Pressable,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { usePosStore } from "../../../store/posStore";
import { useTheme } from "../../../hooks/useTheme";
import { axiosClient } from "../../../api/axiosClient";
import { Typography } from "../../../components/ui/Typography";
import { paymentApi, type CreateQrData } from "../../../api/paymentApi";

import { ProductGrid } from "../components/ProductGrid";
import { CartSummary } from "../components/CartSummary";
import { QRPaymentModal } from "../components/QRPaymentModal";
import { showAlert } from "../../../utils/alerts";
import { printDocument } from "../../../utils/printUtils";
import { generateOrderReceiptHTML } from "../../../utils/printTemplates";

export const PosScreen = () => {
    const { colors, metrics } = useTheme();
    const { width } = useWindowDimensions();
    const isLargeScreen = width >= 1024;

    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState<any[]>([]);

    // Warehouse States
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [warehouseId, setWarehouseId] = useState<number | null>(null);
    const [warehouseName, setWarehouseName] = useState<string>("");
    const [showWarehouseModal, setShowWarehouseModal] = useState(true);

    // Filter States
    const [searchKeyword, setSearchKeyword] = useState("");
    const [activeCategoryId, setActiveCategoryId] = useState(0);
    const [showQrModal, setShowQrModal] = useState(false);
    const [qrData, setQrData] = useState<CreateQrData | null>(null);
    const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);
    const [pendingOrderNo, setPendingOrderNo] = useState<string>("");
    const [pendingAmount, setPendingAmount] = useState<number>(0);
    const [timeLeftSec, setTimeLeftSec] = useState(120);
    const [checkoutError, setCheckoutError] = useState<string>("");

    // Mobile: Cart Bottom Sheet
    const [showCartSheet, setShowCartSheet] = useState(false);

    const {
        cart,
        addToCart,
        customerId,
        discountAmount,
        couponCode,
        surchargeAmount,
        paymentMethod,
        note,
        clearCart,
        getNetAmount,
        getGrossAmount,
    } = usePosStore();

    useEffect(() => {
        fetchWarehouses();
        fetchCustomers();
    }, []);

    useEffect(() => {
        fetchProductsByWarehouse();
    }, [warehouseId]);

    const fetchWarehouses = async () => {
        try {
            const res = await axiosClient.get("/warehouses");
            setWarehouses(res.data.content || res.data || []);
        } catch (e) {
            console.log("Lỗi fetch kho:", e);
        }
    };

    const fetchProductsByWarehouse = async () => {
        if (!warehouseId) {
            setProducts([]);
            return;
        }
        try {
            setLoading(true);
            const res = await axiosClient.get(`/products/stock-by-warehouse?warehouseId=${warehouseId}`);
            setProducts(res.data);
        } catch (error) {
            console.log("Lỗi fetch sản phẩm:", error);
            showAlert("Lỗi", "Không thể lấy danh sách sản phẩm từ máy chủ.");
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await axiosClient.get("/customers");
            setCustomers(res.data.content || res.data || []);
        } catch (error) {
            console.log("Lỗi fetch khách hàng:", error);
        }
    };

    const handleAddToCart = (product: any) => {
        if (product.onHand <= 0) {
            showAlert("Hết hàng", "Sản phẩm này đã hết trong kho!");
            return;
        }
        addToCart(product);
    };

    const handleCheckout = async () => {
        setCheckoutError("");

        if (cart.length === 0) {
            showAlert("Lỗi", "Giỏ hàng đang trống!");
            return;
        }
        if (!warehouseId) {
            showAlert("Chưa chọn kho", "Vui lòng chọn kho xuất hàng trước khi thanh toán!");
            setShowWarehouseModal(true);
            return;
        }

        const payload = {
            customerId: customerId || null,
            warehouseId: warehouseId,
            salesChannel: "POS",
            discountAmount: discountAmount || 0,
            couponCode: couponCode || null,
            surchargeAmount: surchargeAmount || 0,
            paymentMethod: paymentMethod,
            note: note || "",
            items: cart.map((i) => ({
                productId: i.id,
                qty: i.quantity,
                salePrice: i.salePrice,
            })),
        };

        try {
            setLoading(true);
            const res = await axiosClient.post("/orders", payload);

            const createdOrder = res.data?.data || res.data;
            const orderId: number = createdOrder.id;
            const orderNo: string = createdOrder.orderNo;
            const netAmount: number = Number(createdOrder.netAmount || 0);

            if (!orderId) {
                throw new Error("Đã tạo đơn nhưng không nhận được orderId từ backend");
            }

            if (paymentMethod === "TRANSFER") {
                const qrRes = await paymentApi.createQr(orderId);
                if (!qrRes?.success || !qrRes?.data) {
                    throw new Error(qrRes?.message || "Không tạo được QR thanh toán");
                }

                setQrData(qrRes.data);
                setPendingOrderId(orderId);
                setPendingOrderNo(orderNo);
                setPendingAmount(netAmount);
                setTimeLeftSec(120);
                setShowQrModal(true);
                setShowCartSheet(false);

                showAlert(
                    "Đã tạo QR",
                    `Đơn hàng #${orderNo}\nKhách cần trả: ${netAmount.toLocaleString("vi-VN")} đ`,
                );
                clearCart();
                return;
            }

            showAlert("Thành công", `Đã tạo Đơn hàng #${orderNo}`);
            setShowCartSheet(false);

            // In hoá đơn tự động
            try {
                const detailRes = await axiosClient.get(`/orders/${orderId}`);
                const html = generateOrderReceiptHTML(detailRes.data);
                await printDocument(html);
            } catch (printErr) {
                console.log("Lỗi in hoá đơn tự động", printErr);
            }

            clearCart();
            fetchProductsByWarehouse();
        } catch (error: any) {
            console.log("Lỗi thanh toán:", error);
            const errMessage =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Đã xảy ra lỗi";
            setCheckoutError(errMessage);
            showAlert("Lỗi", errMessage);
        } finally {
            setLoading(false);
        }
    };

    const renderWarehouseModal = () => (
        <Modal
            visible={showWarehouseModal}
            transparent
            animationType="fade"
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
                    <View style={styles.modalHeader}>
                        <MaterialCommunityIcons name="warehouse" size={28} color={colors.primary} />
                        <Typography variant="heading2" color={colors.textPrimary}>Chọn Kho Xuất Hàng</Typography>
                    </View>
                    <Typography variant="caption" color={colors.textSecondary} style={{ marginBottom: 16 }}>
                        Vui lòng chọn kho trước khi bắt đầu bán hàng
                    </Typography>

                    <View style={styles.warehouseList}>
                        {warehouses.length === 0 ? (
                            <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
                        ) : (
                            warehouses.filter((w) => w.isActive).map((w) => (
                                <TouchableOpacity
                                    key={w.id}
                                    style={[
                                        styles.warehouseItem,
                                        { borderColor: colors.border },
                                        warehouseId === w.id && { borderColor: colors.primary, backgroundColor: 'rgba(0,113,227,0.05)' }
                                    ]}
                                    onPress={() => {
                                        if (warehouseId !== w.id) {
                                            clearCart();
                                        }
                                        setWarehouseId(w.id);
                                        setWarehouseName(w.name);
                                        setShowWarehouseModal(false);
                                    }}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Typography variant="bodyEmphasized" color={warehouseId === w.id ? colors.primary : colors.textPrimary}>
                                            {w.name}
                                        </Typography>
                                        {w.address ? (
                                            <Typography variant="caption" color={colors.textSecondary} numberOfLines={1}>
                                                {w.address}
                                            </Typography>
                                        ) : null}
                                    </View>
                                    {warehouseId === w.id && <Feather name="check-circle" size={20} color={colors.primary} />}
                                </TouchableOpacity>
                            ))
                        )}
                    </View>

                    {warehouseId && (
                        <TouchableOpacity
                            style={[styles.modalConfirmBtn, { backgroundColor: colors.primary, borderRadius: metrics.borderRadius.medium }]}
                            onPress={() => setShowWarehouseModal(false)}
                        >
                            <Typography variant="bodyEmphasized" color={colors.buttonText}>Xác nhận</Typography>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );

    // ─── DESKTOP Layout ─────────────────────────────────────────────────────────
    if (isLargeScreen) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={{ flexDirection: 'row', flex: 1 }}>
                    <ProductGrid
                        products={products}
                        loading={loading}
                        searchKeyword={searchKeyword}
                        setSearchKeyword={setSearchKeyword}
                        activeCategoryId={activeCategoryId}
                        setActiveCategoryId={setActiveCategoryId}
                        handleAddToCart={handleAddToCart}
                    />
                    <CartSummary
                        customers={customers}
                        warehouseId={warehouseId}
                        warehouseName={warehouseName}
                        setShowWarehouseModal={setShowWarehouseModal}
                        handleCheckout={handleCheckout}
                        loading={loading}
                    />
                </View>
                {renderWarehouseModal()}
                <QRPaymentModal
                    visible={showQrModal}
                    qrData={qrData}
                    pendingOrderId={pendingOrderId}
                    pendingOrderNo={pendingOrderNo}
                    pendingAmount={pendingAmount}
                    initialTimeLeftSec={timeLeftSec}
                    onClose={() => { setShowQrModal(false); setPendingOrderId(null); }}
                    onSuccess={async () => {
                        setShowQrModal(false);
                        showAlert("Thành công", `Đơn #${pendingOrderNo} đã thanh toán thành công.`);
                        if (pendingOrderId) {
                            try {
                                const detailRes = await axiosClient.get(`/orders/${pendingOrderId}`);
                                const html = generateOrderReceiptHTML(detailRes.data);
                                await printDocument(html);
                            } catch (printErr) { console.log("Lỗi in hoá đơn", printErr); }
                        }
                        setPendingOrderId(null);
                        fetchProductsByWarehouse();
                    }}
                    onCancel={() => { setShowQrModal(false); setPendingOrderId(null); fetchProductsByWarehouse(); }}
                    onChangeMethodToCash={async () => {
                        setShowQrModal(false);
                        showAlert("Thành công", "Đã đổi sang thanh toán tiền mặt.");
                        if (pendingOrderId) {
                            try {
                                const detailRes = await axiosClient.get(`/orders/${pendingOrderId}`);
                                const html = generateOrderReceiptHTML(detailRes.data);
                                await printDocument(html);
                            } catch (printErr) { console.log("Lỗi in hoá đơn", printErr); }
                        }
                        setPendingOrderId(null);
                        fetchProductsByWarehouse();
                    }}
                />
            </View>
        );
    }

    // ─── MOBILE Layout ───────────────────────────────────────────────────────────
    const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
    const netAmount = getNetAmount();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Danh sách sản phẩm chiếm toàn màn hình */}
            <View style={{ flex: 1 }}>
                <ProductGrid
                    products={products}
                    loading={loading}
                    searchKeyword={searchKeyword}
                    setSearchKeyword={setSearchKeyword}
                    activeCategoryId={activeCategoryId}
                    setActiveCategoryId={setActiveCategoryId}
                    handleAddToCart={handleAddToCart}
                />
            </View>

            {/* Floating Cart Bar — luôn nổi ở dưới đáy */}
            <TouchableOpacity
                style={[styles.floatingCartBar, { backgroundColor: colors.primary }]}
                onPress={() => setShowCartSheet(true)}
                activeOpacity={0.85}
            >
                <View style={styles.floatingCartLeft}>
                    <View style={[styles.floatingCartBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                        <Typography variant="captionBold" color="#fff">{totalItems}</Typography>
                    </View>
                    <Typography variant="bodyEmphasized" color="#fff">
                        {warehouseName ? warehouseName : "Chưa chọn kho"}
                    </Typography>
                </View>
                <View style={styles.floatingCartRight}>
                    <Typography variant="bodyEmphasized" color="#fff">
                        {netAmount.toLocaleString("vi-VN")} đ
                    </Typography>
                    <Feather name="chevron-up" size={20} color="#fff" />
                </View>
            </TouchableOpacity>

            {/* Cart Bottom Sheet Modal */}
            <Modal
                visible={showCartSheet}
                transparent
                animationType="slide"
                onRequestClose={() => setShowCartSheet(false)}
            >
                <View style={styles.cartSheetOverlay}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowCartSheet(false)} />
                    <View style={[styles.cartSheetBox, { backgroundColor: colors.surface }]}>
                        {/* Handle bar */}
                        <View style={styles.cartSheetHandle}>
                            <View style={[styles.cartHandleBar, { backgroundColor: colors.border }]} />
                        </View>
                        <CartSummary
                            customers={customers}
                            warehouseId={warehouseId}
                            warehouseName={warehouseName}
                            setShowWarehouseModal={(v: boolean) => {
                                setShowCartSheet(false);
                                setShowWarehouseModal(v);
                            }}
                            handleCheckout={handleCheckout}
                            loading={loading}
                        />
                    </View>
                </View>
            </Modal>

            {renderWarehouseModal()}
            <QRPaymentModal
                visible={showQrModal}
                qrData={qrData}
                pendingOrderId={pendingOrderId}
                pendingOrderNo={pendingOrderNo}
                pendingAmount={pendingAmount}
                initialTimeLeftSec={timeLeftSec}
                onClose={() => { setShowQrModal(false); setPendingOrderId(null); }}
                onSuccess={async () => {
                    setShowQrModal(false);
                    showAlert("Thành công", `Đơn #${pendingOrderNo} đã thanh toán thành công.`);
                    if (pendingOrderId) {
                        try {
                            const detailRes = await axiosClient.get(`/orders/${pendingOrderId}`);
                            const html = generateOrderReceiptHTML(detailRes.data);
                            await printDocument(html);
                        } catch (printErr) { console.log("Lỗi in hoá đơn", printErr); }
                    }
                    setPendingOrderId(null);
                    fetchProductsByWarehouse();
                }}
                onCancel={() => { setShowQrModal(false); setPendingOrderId(null); fetchProductsByWarehouse(); }}
                onChangeMethodToCash={async () => {
                    setShowQrModal(false);
                    showAlert("Thành công", "Đã đổi sang thanh toán tiền mặt.");
                    if (pendingOrderId) {
                        try {
                            const detailRes = await axiosClient.get(`/orders/${pendingOrderId}`);
                            const html = generateOrderReceiptHTML(detailRes.data);
                            await printDocument(html);
                        } catch (printErr) { console.log("Lỗi in hoá đơn", printErr); }
                    }
                    setPendingOrderId(null);
                    fetchProductsByWarehouse();
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    modalOverlay: {
        flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center", alignItems: "center"
    },
    modalBox: {
        borderRadius: 16, padding: 24, width: "90%", maxWidth: 480,
        elevation: 10
    },
    modalHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
    warehouseList: { gap: 8, marginBottom: 20 },
    warehouseItem: {
        flexDirection: "row", alignItems: "center", padding: 12,
        borderRadius: 8, borderWidth: 1
    },
    modalConfirmBtn: { padding: 12, alignItems: "center" },
    // Floating Cart Bar
    floatingCartBar: {
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        paddingHorizontal: 20, paddingVertical: 14,
        marginHorizontal: 12, marginBottom: 12,
        borderRadius: 16, elevation: 8,
        shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    },
    floatingCartLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    floatingCartRight: { flexDirection: "row", alignItems: "center", gap: 8 },
    floatingCartBadge: {
        width: 26, height: 26, borderRadius: 13,
        alignItems: "center", justifyContent: "center",
    },
    // Cart Bottom Sheet
    cartSheetOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
    cartSheetBox: {
        height: "90%", borderTopLeftRadius: 24, borderTopRightRadius: 24,
        overflow: "hidden",
    },
    cartSheetHandle: { alignItems: "center", paddingVertical: 10 },
    cartHandleBar: { width: 40, height: 4, borderRadius: 2 },
});

export default PosScreen;
