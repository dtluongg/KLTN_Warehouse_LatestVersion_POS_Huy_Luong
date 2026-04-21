import React, { useEffect, useState } from "react";
import {
    View,
    ScrollView,
    StyleSheet,
    useWindowDimensions,
    Alert,
    Text,
    TouchableOpacity,
    Modal,
    ActivityIndicator
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { usePosStore } from "../../../store/posStore";
import { useTheme } from "../../../hooks/useTheme";
import { axiosClient } from "../../../api/axiosClient";
import { Typography } from "../../../components/ui/Typography";

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
            Alert.alert(
                "Thành công",
                `Đã tạo Đơn hàng #${res.data.orderNo}\nKhách phải trả: ${res.data.netAmount.toLocaleString("vi-VN")} đ`,
            );
            clearCart();
            fetchProductsByWarehouse();
        } catch (error: any) {
            console.log("Lỗi thanh toán:", error);
            Alert.alert("Lỗi", error?.response?.data?.message || "Đã xảy ra lỗi");
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
    modalConfirmBtn: { padding: 12, alignItems: "center" }
});

export default PosScreen;
