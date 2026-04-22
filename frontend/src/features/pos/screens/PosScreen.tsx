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
    const [timeLeftSec, setTimeLeftSec] = useState(300);
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

    useEffect(() => {
        if (!showQrModal || !pendingOrderId) {
            return;
        }

        const poller = setInterval(async () => {
            try {
                const res = await paymentApi.checkPaymentStatus(pendingOrderId);

                if (!res.success) return;

                const { orderStatus, payosStatus } = res;

                console.log("PayOS:", payosStatus, "| DB:", orderStatus);

                // ✅ Thanh toán thành công
                if (orderStatus === "POSTED") {
                    clearInterval(poller);
                    clearInterval(countdown);

                    setShowQrModal(false);
                    setPendingOrderId(null);

                    Alert.alert("Thành công", `Đơn #${pendingOrderNo} đã thanh toán thành công.`);
                    fetchProductsByWarehouse();
                    return;
                }

                // ❌ Bị huỷ
                if (orderStatus === "CANCELLED") {
                    clearInterval(poller);
                    clearInterval(countdown);

                    setShowQrModal(false);
                    setPendingOrderId(null);

                    Alert.alert("Thanh toán thất bại", `Đơn #${pendingOrderNo} đã bị huỷ.`);
                }

            } catch (e) {
                console.log("Lỗi check payment:", e);
            }
        }, 3000);

        const countdown = setInterval(() => {
            setTimeLeftSec((prev) => {
                if (prev <= 1) {
                    clearInterval(poller);
                    clearInterval(countdown);
                    setShowQrModal(false);
                    setPendingOrderId(null);
                    Alert.alert("Hết thời gian", "QR đã hết thời gian chờ. Vui lòng tạo giao dịch mới.");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(poller);
            clearInterval(countdown);
        };
    }, [showQrModal, pendingOrderId, pendingOrderNo]);

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
            Alert.alert("Lỗi", "Không thể lấy danh sách sản phẩm từ máy chủ.");
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
            Alert.alert("Hết hàng", "Sản phẩm này đã hết trong kho!");
            return;
        }
        addToCart(product);
    };

    const handleCheckout = async () => {
        setCheckoutError("");

        if (cart.length === 0) {
            Alert.alert("Lỗi", "Giỏ hàng đang trống!");
            return;
        }
        if (!warehouseId) {
            Alert.alert("Chưa chọn kho", "Vui lòng chọn kho xuất hàng trước khi thanh toán!");
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
                setTimeLeftSec(300);
                setShowQrModal(true);

                Alert.alert(
                    "Đã tạo QR",
                    `Đơn hàng #${orderNo}\nKhách cần trả: ${netAmount.toLocaleString("vi-VN")} đ`,
                );
                clearCart();
                return;
            }

            Alert.alert("Thành công", `Đã tạo Đơn hàng #${orderNo}`);
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
            Alert.alert("Lỗi", errMessage);
        } finally {
            setLoading(false);
        }
    };

    const renderQrPaymentModal = () => {
        const minutes = Math.floor(timeLeftSec / 60)
            .toString()
            .padStart(2, "0");
        const seconds = (timeLeftSec % 60).toString().padStart(2, "0");

        const buildQrImageUri = () => {
            const rawQr = (qrData?.qrCode || "").trim();
            if (rawQr) {
                if (rawQr.startsWith("data:image") || rawQr.startsWith("http://") || rawQr.startsWith("https://")) {
                    return rawQr;
                }
                return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(rawQr)}`;
            }

            const checkout = (qrData?.checkoutUrl || "").trim();
            if (checkout) {
                return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(checkout)}`;
            }

            return "";
        };

        const qrImageUri = buildQrImageUri();

        return (
            <Modal visible={showQrModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <MaterialCommunityIcons name="qrcode-scan" size={28} color={colors.primary} />
                            <Typography variant="heading2" color={colors.textPrimary}>Thanh Toán QR</Typography>
                        </View>

                        <Typography variant="body" color={colors.textSecondary} style={{ marginBottom: 8 }}>
                            Đơn #{pendingOrderNo}
                        </Typography>
                        <Typography variant="heading2" color={colors.primary} style={{ marginBottom: 12 }}>
                            {pendingAmount.toLocaleString("vi-VN")} đ
                        </Typography>

                        <View style={[styles.qrWrap, { borderColor: colors.border }]}>
                            {!!qrImageUri ? (
                                <Image source={{ uri: qrImageUri }} style={styles.qrImage} resizeMode="contain" />
                            ) : (
                                <Typography variant="body" color={colors.textSecondary}>Không có dữ liệu QR hợp lệ</Typography>
                            )}
                        </View>

                        <Typography variant="caption" color={colors.textSecondary} style={{ marginTop: 12, textAlign: "center" }}>
                            Thời gian còn lại: {minutes}:{seconds}
                        </Typography>

                        {!!qrData?.checkoutUrl && (
                            <TouchableOpacity
                                style={[styles.modalConfirmBtn, { backgroundColor: colors.primary, borderRadius: metrics.borderRadius.medium, marginTop: 12 }]}
                                onPress={() => Linking.openURL(qrData.checkoutUrl as string)}
                            >
                                <Typography variant="bodyEmphasized" color={colors.buttonText}>Mở Trang Thanh Toán</Typography>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.modalConfirmBtn, { backgroundColor: colors.primary, borderRadius: metrics.borderRadius.medium, marginTop: 12 }]}
                            onPress={async () => {
                                try {
                                    await paymentApi.changePaymentMethod(pendingOrderId, "CASH");
                                    setShowQrModal(false);
                                    Alert.alert("Thành công", "Đã đổi sang thanh toán tiền mặt.");
                                } catch (e) {
                                    Alert.alert("Lỗi", "Không thể đổi phương thức: " + (e?.message || e));
                                }
                            }}
                        >
                            <Typography variant="bodyEmphasized" color={colors.buttonText}>Đổi sang tiền mặt</Typography>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalCloseBtn, { borderColor: colors.danger, borderRadius: metrics.borderRadius.medium }]}
                            onPress={() => {
                                Alert.alert(
                                    "Xác nhận hủy đơn",
                                    "Bạn có chắc muốn hủy đơn này?",
                                    [
                                        { text: "Không", style: "cancel" },
                                        {
                                            text: "Hủy đơn",
                                            style: "destructive",
                                            onPress: async () => {
                                                try {
                                                    await paymentApi.cancelOrder(pendingOrderId);
                                                    setShowQrModal(false);
                                                    Alert.alert("Thành công", "Đơn hàng đã được hủy.");
                                                } catch (e) {
                                                    Alert.alert("Lỗi", "Không thể hủy đơn: " + (e?.message || e));
                                                }
                                            },
                                        },
                                    ]
                                );
                            }}
                        >
                            <Typography variant="bodyEmphasized" color={colors.danger}>Hủy đơn</Typography>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalCloseBtn, { borderColor: colors.border, borderRadius: metrics.borderRadius.medium }]}
                            onPress={() => setShowQrModal(false)}
                        >
                            <Typography variant="bodyEmphasized" color={colors.textPrimary}>Ẩn QR</Typography>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
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
            {renderQrPaymentModal()}
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
