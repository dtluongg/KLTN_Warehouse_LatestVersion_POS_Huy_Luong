import React, { useState, useEffect, useRef } from "react";
import {
    View,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    StyleSheet,
    useWindowDimensions
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { usePosStore } from "../../../store/posStore";
import { useTheme } from "../../../hooks/useTheme";
import { Typography } from "../../../components/ui/Typography";
import { axiosClient } from "../../../api/axiosClient";

export const CartSummary = ({
    customers,
    warehouseId,
    warehouseName,
    setShowWarehouseModal,
    handleCheckout,
    loading
}: any) => {
    const { colors, metrics } = useTheme();
    const { width } = useWindowDimensions();
    const isLargeScreen = width >= 1024;

    const {
        cart, removeFromCart, updateQuantity, clearCart,
        customerId, setCustomer,
        discountAmount, setDiscountAmount,
        couponCode, setCoupon, couponDiscountAmount,
        surchargeAmount, setSurchargeAmount,
        paymentMethod, setPaymentMethod,
        note, setNote,
        getGrossAmount, getNetAmount,
    } = usePosStore();

    const [customerSearchKeyword, setCustomerSearchKeyword] = useState("");
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
    const [couponPreviewLoading, setCouponPreviewLoading] = useState(false);
    const [couponValid, setCouponValid] = useState<boolean | null>(null);
    const [couponMessage, setCouponMessage] = useState("");
    const couponPreviewRequestId = useRef(0);

    const filteredCustomers = customers.filter((c: any) => {
        if (!customerSearchKeyword) return false;
        const kw = customerSearchKeyword.toLowerCase();
        return c.name.toLowerCase().includes(kw) || (c.phone || "").includes(kw);
    });

    const selectedCustomer = customers.find((c: any) => c.id === customerId);

    const handleSelectCustomer = (id: string) => {
        setCustomer(id);
        setCustomerSearchKeyword("");
        setIsSearchingCustomer(false);
    };

    useEffect(() => {
        const code = couponCode.trim();
        const grossAmount = getGrossAmount();

        if (!code) {
            setCoupon("", 0);
            setCouponValid(null);
            setCouponMessage("");
            setCouponPreviewLoading(false);
            return;
        }

        if (grossAmount <= 0) {
            setCoupon(code, 0);
            setCouponValid(false);
            setCouponMessage("Giỏ hàng rỗng, chưa thể áp mã giảm giá");
            setCouponPreviewLoading(false);
            return;
        }

        const requestId = ++couponPreviewRequestId.current;
        setCouponPreviewLoading(true);

        const debounce = setTimeout(async () => {
            try {
                const res = await axiosClient.get("/orders/preview-coupon", { params: { code, grossAmount } });
                if (requestId !== couponPreviewRequestId.current) return;
                const data = res.data;
                const discount = Number(data?.discountAmount || 0);

                if (data?.valid) {
                    setCoupon(code, discount);
                    setCouponValid(true);
                    setCouponMessage(`Mã hợp lệ: giảm ${discount.toLocaleString("vi-VN")} đ`);
                } else {
                    setCoupon(code, 0);
                    setCouponValid(false);
                    setCouponMessage(data?.message || "Mã giảm giá không hợp lệ");
                }
            } catch (error: any) {
                if (requestId !== couponPreviewRequestId.current) return;
                setCoupon(code, 0);
                setCouponValid(false);
                setCouponMessage(error?.response?.data?.message || "Đã có lỗi xảy ra");
            } finally {
                if (requestId === couponPreviewRequestId.current) {
                    setCouponPreviewLoading(false);
                }
            }
        }, 450);

        return () => clearTimeout(debounce);
    }, [couponCode, cart, getGrossAmount, setCoupon]);

    return (
        <View style={[styles.cartArea, { backgroundColor: colors.surface, borderLeftColor: colors.border }, !isLargeScreen && { flex: 1, borderLeftWidth: 0, marginTop: 16 }]}>
            <ScrollView
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
            >


                {/* Cart Header */}
                <View style={[styles.cartHeader, { borderBottomColor: colors.border }]}>
                    <Typography variant="heading2" color={colors.textHero}>
                        Giỏ Hàng {cart.length > 0 && `(${cart.length})`}
                    </Typography>
                    <TouchableOpacity onPress={clearCart}>
                        <Typography variant="bodyEmphasized" color={colors.danger}>Xóa hết</Typography>
                    </TouchableOpacity>
                </View>

                {/* Warehouse Banner */}
                <TouchableOpacity
                    style={[styles.warehouseBanner, { backgroundColor: 'rgba(0,113,227,0.1)', borderBottomColor: 'rgba(0,113,227,0.2)' }]}
                    onPress={() => setShowWarehouseModal(true)}
                >
                    <MaterialCommunityIcons name="warehouse" size={16} color={colors.primary} />
                    <Typography variant="captionBold" color={colors.primary} style={{ flex: 1 }} numberOfLines={1}>
                        {warehouseId ? warehouseName : "Chưa chọn kho — nhấn để chọn"}
                    </Typography>
                    <Feather name="chevron-down" size={14} color={colors.primary} />
                </TouchableOpacity>

                <View style={[styles.cartList, { padding: isLargeScreen ? metrics.spacing.md : 16 }]}>
                    {/* Customer Dropdown */}
                    <View style={[styles.inputSection, { zIndex: 999 }]}>
                        <Typography variant="micro" color={colors.textSecondary} style={{ textTransform: "uppercase", marginBottom: 8 }}>
                            Khách hàng
                        </Typography>
                        {customerId ? (
                            <View style={[styles.selectedCustomerBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <Typography variant="bodyEmphasized" color={colors.textPrimary} style={{ flex: 1 }} numberOfLines={1}>
                                    {selectedCustomer?.name || "Khách lẻ"}
                                </Typography>
                                <TouchableOpacity onPress={() => setCustomer(null)}>
                                    <Feather name="x-circle" size={18} color={colors.textDisabled} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={{ zIndex: 999 }}>
                                <View style={[styles.searchBarSmall, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                    <Feather name="search" size={18} color={colors.textDisabled} />
                                    <TextInput
                                        style={[styles.searchInputSmall, { color: colors.textPrimary }]}
                                        placeholder="Tra tên hoặc SDT..."
                                        placeholderTextColor={colors.textDisabled}
                                        value={customerSearchKeyword}
                                        onChangeText={(text) => { setCustomerSearchKeyword(text); setIsSearchingCustomer(true); }}
                                        onFocus={() => setIsSearchingCustomer(true)}
                                    />
                                </View>
                                {isSearchingCustomer && customerSearchKeyword.trim() !== "" && (
                                    <View style={[styles.customerDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                        {filteredCustomers.length > 0 ? (
                                            filteredCustomers.map((c: any) => (
                                                <TouchableOpacity
                                                    key={c.id}
                                                    style={[styles.customerDropdownItem, { borderBottomColor: colors.border }]}
                                                    onPress={() => handleSelectCustomer(c.id)}
                                                >
                                                    <Typography variant="bodyEmphasized" color={colors.textPrimary}>{c.name}</Typography>
                                                    <Typography variant="caption" color={colors.textSecondary}>{c.phone || "—"}</Typography>
                                                </TouchableOpacity>
                                            ))
                                        ) : (
                                            <Typography style={{ padding: 12 }} color={colors.textDisabled}>Không tìm thấy khách hàng.</Typography>
                                        )}
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Items List */}
                    {cart.length === 0 ? (
                        <View style={{ alignItems: "center", paddingVertical: 40 }}>
                            <Feather name="shopping-cart" size={48} color={colors.border} />
                            <Typography style={{ marginTop: 16 }} color={colors.textDisabled}>Giỏ hàng rỗng</Typography>
                        </View>
                    ) : (
                        <View style={{ marginBottom: 16 }}>
                            {cart.map((item) => (
                                <View key={item.id} style={[styles.cartItem, { borderBottomColor: colors.border }]}>
                                    <View style={styles.cartItemInfo}>
                                        <Typography variant="bodyEmphasized" color={colors.textPrimary} style={{ marginBottom: 4 }} numberOfLines={2}>
                                            {item.name}
                                        </Typography>
                                        <Typography variant="bodyEmphasized" color={colors.primary}>
                                            {item.salePrice.toLocaleString("vi-VN")} đ
                                        </Typography>
                                    </View>
                                    <View style={styles.cartItemControls}>
                                        <View style={[styles.quantityBox, { borderColor: colors.border, backgroundColor: colors.background, borderRadius: metrics.borderRadius.small }]}>
                                            <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)} style={styles.qtyBtn}>
                                                <Feather name="minus" size={16} color={colors.textPrimary} />
                                            </TouchableOpacity>
                                            <Typography variant="bodyEmphasized" color={colors.textPrimary} style={styles.qtyText}>
                                                {item.quantity}
                                            </Typography>
                                            <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} style={styles.qtyBtn}>
                                                <Feather name="plus" size={16} color={colors.textPrimary} />
                                            </TouchableOpacity>
                                        </View>
                                        <TouchableOpacity onPress={() => removeFromCart(item.id)} style={{ marginTop: 12 }}>
                                            <Feather name="x" size={18} color={colors.danger} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Modifiers */}
                    {cart.length > 0 && (
                        <View style={[styles.invoiceModifiers, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: metrics.borderRadius.medium }]}>
                            <View style={styles.modifierRow}>
                                <Typography variant="caption" color={colors.textPrimary} style={{ flex: 1 }}>Chiết khấu (VND):</Typography>
                                <TextInput
                                    style={[styles.numericInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.textPrimary }]}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor={colors.textDisabled}
                                    value={discountAmount ? discountAmount.toString() : ""}
                                    onChangeText={(val) => setDiscountAmount(Number(val) || 0)}
                                />
                            </View>
                            <View style={styles.modifierRow}>
                                <Typography variant="caption" color={colors.textPrimary} style={{ flex: 1 }}>Mã giảm giá:</Typography>
                                <TextInput
                                    style={[styles.numericInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.textPrimary }]}
                                    placeholder="Nhập mã..."
                                    placeholderTextColor={colors.textDisabled}
                                    value={couponCode}
                                    onChangeText={(val) => setCoupon(val, 0)}
                                />
                            </View>
                            {couponCode.trim().length > 0 && (
                                <Typography variant="micro" color={couponPreviewLoading ? colors.textSecondary : couponValid ? colors.primary : colors.danger} style={{ marginTop: -2 }}>
                                    {couponPreviewLoading ? "Đang kiểm tra mã..." : couponMessage || `Giảm ${couponDiscountAmount.toLocaleString("vi-VN")} đ`}
                                </Typography>
                            )}
                            <View style={styles.modifierRow}>
                                <Typography variant="caption" color={colors.textPrimary} style={{ flex: 1 }}>Phụ phí (VND):</Typography>
                                <TextInput
                                    style={[styles.numericInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.textPrimary }]}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor={colors.textDisabled}
                                    value={surchargeAmount ? surchargeAmount.toString() : ""}
                                    onChangeText={(val) => setSurchargeAmount(Number(val) || 0)}
                                />
                            </View>
                            <View style={[styles.modifierRow, { marginTop: 4 }]}>
                                <Typography variant="caption" color={colors.textPrimary} style={{ flex: 1 }}>Ghi chú:</Typography>
                                <TextInput
                                    style={[styles.numericInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.textPrimary, textAlign: 'left' }]}
                                    placeholder="Nhập ghi chú..."
                                    placeholderTextColor={colors.textDisabled}
                                    value={note}
                                    onChangeText={setNote}
                                />
                            </View>
                        </View>
                    )}

                    {/* Payments */}
                    {cart.length > 0 && (
                        <View style={styles.inputSection}>
                            <Typography variant="micro" color={colors.textSecondary} style={{ textTransform: "uppercase", marginBottom: 8 }}>
                                Hình thức Thanh toán
                            </Typography>
                            <View style={styles.paymentMethodRow}>
                                {["CASH", "TRANSFER", "CARD"].map((method) => {
                                    const isActive = paymentMethod === method;
                                    return (
                                        <TouchableOpacity
                                            key={method}
                                            style={[
                                                styles.paymentBtn,
                                                { borderColor: colors.border, backgroundColor: colors.surface },
                                                isActive && { backgroundColor: colors.primary, borderColor: colors.primary }
                                            ]}
                                            onPress={() => setPaymentMethod(method as any)}
                                        >
                                            <Typography variant="captionBold" color={isActive ? colors.buttonText : colors.textPrimary}>
                                                {method === "CASH" ? "Tiền mặt" : method === "TRANSFER" ? "Chuyển khoản" : "Quẹt thẻ"}
                                            </Typography>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    )}
                </View>

                {/* Footer Summary */}
                <View style={[styles.cartFooter, { borderTopColor: colors.border, backgroundColor: isLargeScreen ? 'rgba(0,0,0,0.02)' : colors.background }]}>
                    <View style={styles.summaryRow}>
                        <Typography variant="body" color={colors.textSecondary}>Tổng tiền hàng</Typography>
                        <Typography variant="bodyEmphasized" color={colors.textPrimary}>{getGrossAmount().toLocaleString("vi-VN")} đ</Typography>
                    </View>
                    {(discountAmount > 0 || couponCode.length > 0) && (
                        <View style={styles.summaryRow}>
                            <Typography variant="body" color={colors.textSecondary}>Tiền giảm giá</Typography>
                            <Typography variant="bodyEmphasized" color={colors.danger}>- {(discountAmount + couponDiscountAmount).toLocaleString("vi-VN")} đ</Typography>
                        </View>
                    )}
                    {surchargeAmount > 0 && (
                        <View style={styles.summaryRow}>
                            <Typography variant="body" color={colors.textSecondary}>Phí khác</Typography>
                            <Typography variant="bodyEmphasized" color={colors.textPrimary}>+ {surchargeAmount.toLocaleString("vi-VN")} đ</Typography>
                        </View>
                    )}
                    <View style={[styles.summaryTotalRow, { borderTopColor: colors.border }]}>
                        <Typography variant="heading2" color={colors.textHero}>Khách Cần Trả</Typography>
                        <Typography variant="heading2" color={colors.primary}>{getNetAmount().toLocaleString("vi-VN")} đ</Typography>
                    </View>

                    <TouchableOpacity
                        style={[styles.checkoutBtn, { backgroundColor: colors.primary, borderRadius: metrics.borderRadius.medium }, (cart.length === 0 || loading) && { opacity: 0.5 }]}
                        onPress={handleCheckout}
                        disabled={cart.length === 0 || loading}
                    >
                        <Typography variant="bodyEmphasized" color={colors.buttonText} style={{ textTransform: "uppercase" }}>
                            Xác nhận Thanh toán
                        </Typography>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    cartArea: { flex: 3.5, borderLeftWidth: 1 },
    cartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1 },
    warehouseBanner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
    cartList: {},
    inputSection: { marginBottom: 16 },
    searchBarSmall: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, height: 40 },
    searchInputSmall: { flex: 1, marginLeft: 8, fontSize: 14 },
    customerDropdown: { position: "absolute", top: 44, left: 0, right: 0, borderWidth: 1, borderRadius: 8, maxHeight: 180, elevation: 10, zIndex: 9999 },
    customerDropdownItem: { padding: 14, borderBottomWidth: 1 },
    selectedCustomerBox: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, paddingHorizontal: 16, height: 40, borderRadius: 999 },
    cartItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1 },
    cartItemInfo: { flex: 1, marginRight: 10 },
    cartItemControls: { justifyContent: "space-between", alignItems: "flex-end" },
    quantityBox: { flexDirection: "row", alignItems: "center", borderWidth: 1 },
    qtyBtn: { padding: 6 },
    qtyText: { minWidth: 20, textAlign: "center" },
    invoiceModifiers: { padding: 12, borderWidth: 1, marginBottom: 16, gap: 12 },
    modifierRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    numericInput: { borderWidth: 1, borderRadius: 4, width: 120, height: 32, paddingHorizontal: 8, textAlign: "right" },
    paymentMethodRow: { flexDirection: "row", gap: 8 },
    paymentBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderWidth: 1, borderRadius: 8 },
    cartFooter: { padding: 16, borderTopWidth: 1 },
    summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    summaryTotalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderStyle: "dashed", marginBottom: 16 },
    checkoutBtn: { padding: 16, alignItems: "center" }
});
