import React, { useEffect, useState } from "react";
import {
    View,
    ScrollView,
    StyleSheet,
    useWindowDimensions,
    Alert,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    Image,
    Linking
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

                showAlert(
                    "Đã tạo QR",
                    `Đơn hàng #${orderNo}\nKhách cần trả: ${netAmount.toLocaleString("vi-VN")} đ`,
                );
                clearCart();
                return;
            }

            showAlert("Thành công", `Đã tạo Đơn hàng #${orderNo}`);
            
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
    // Layout Rendering
    const content = (
        <>
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
            {!!checkoutError && (
                <View style={[styles.checkoutErrorBox, { borderColor: colors.danger, backgroundColor: "rgba(255,59,48,0.08)" }]}>
                    <Typography variant="captionBold" color={colors.danger}>Lỗi thanh toán: {checkoutError}</Typography>
                </View>
            )}
        </>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {isLargeScreen ? (
                <View style={{ flexDirection: 'row', flex: 1 }}>{content}</View>
            ) : (
                <ScrollView
                    style={{ flex: 1 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {content}
                </ScrollView>
            )}
            {renderWarehouseModal()}
            {/* Remove renderQrPaymentModal call */}
            <QRPaymentModal
                visible={showQrModal}
                qrData={qrData}
                pendingOrderId={pendingOrderId}
                pendingOrderNo={pendingOrderNo}
                pendingAmount={pendingAmount}
                initialTimeLeftSec={timeLeftSec}
                onClose={() => {
                    setShowQrModal(false);
                    setPendingOrderId(null);
                }}
                onSuccess={async () => {
                    setShowQrModal(false);
                    showAlert("Thành công", `Đơn #${pendingOrderNo} đã thanh toán thành công.`);
                    if (pendingOrderId) {
                        try {
                            const detailRes = await axiosClient.get(`/orders/${pendingOrderId}`);
                            const html = generateOrderReceiptHTML(detailRes.data);
                            await printDocument(html);
                        } catch (printErr) {
                            console.log("Lỗi in hoá đơn tự động", printErr);
                        }
                    }
                    setPendingOrderId(null);
                    fetchProductsByWarehouse();
                }}
                onCancel={() => {
                    setShowQrModal(false);
                    setPendingOrderId(null);
                    fetchProductsByWarehouse();
                }}
                onChangeMethodToCash={async () => {
                    setShowQrModal(false);
                    showAlert("Thành công", "Đã đổi sang thanh toán tiền mặt.");
                    if (pendingOrderId) {
                        try {
                            const detailRes = await axiosClient.get(`/orders/${pendingOrderId}`);
                            const html = generateOrderReceiptHTML(detailRes.data);
                            await printDocument(html);
                        } catch (printErr) {
                            console.log("Lỗi in hoá đơn tự động", printErr);
                        }
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
    checkoutErrorBox: { marginHorizontal: 12, marginBottom: 12, borderWidth: 1, borderRadius: 8, padding: 10 },
    modalConfirmBtn: { padding: 12, alignItems: "center" },
    modalCloseBtn: { padding: 12, alignItems: "center", borderWidth: 1, marginTop: 8 },
    qrWrap: { borderWidth: 1, borderRadius: 12, padding: 12, alignItems: "center", justifyContent: "center" },
    qrImage: { width: 260, height: 260 }
});

export default PosScreen;
