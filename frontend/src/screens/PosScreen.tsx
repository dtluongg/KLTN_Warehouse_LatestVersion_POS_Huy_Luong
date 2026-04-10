import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    ScrollView,
    useWindowDimensions,
    Image,
} from "react-native";
import { theme } from "../utils/theme";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { usePosStore } from "../store/posStore";

import { axiosClient } from "../api/axiosClient";

// Tạm Mock Type Data
export interface Product {
    id: number;
    name: string;
    sku: string;
    shortName?: string;
    barcode?: string;
    categoryId?: number;
    category?: { id: number; name: string };
    salePrice: number;
    onHand: number;
    imageUrl?: string;
}

export interface Warehouse {
    id: number;
    code: string;
    name: string;
    address?: string;
    isActive: boolean;
}

interface CustomerOption {
    id: string;
    name: string;
    phone?: string;
}

const MOCK_CATEGORIES = [
    { id: 0, name: "Tất cả" },
    { id: 1, name: "Phân bón" },
    { id: 2, name: "Thuốc BVTV" },
    { id: 3, name: "Hạt giống" },
    { id: 4, name: "Dụng cụ" },
];

export const PosScreen = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState<CustomerOption[]>([]);

    // Warehouse States
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [warehouseId, setWarehouseId] = useState<number | null>(null);
    const [warehouseName, setWarehouseName] = useState<string>("");
    const [showWarehouseModal, setShowWarehouseModal] = useState(true); // Tự mở khi vào POS

    // Filter States
    const [searchKeyword, setSearchKeyword] = useState("");
    const [activeCategoryId, setActiveCategoryId] = useState(0);

    // Responsive
    const { width } = useWindowDimensions();
    const isLargeScreen = width >= 1024;

    // Mobile Tabs
    const [mobileTab, setMobileTab] = useState<"PRODUCTS" | "CART">("PRODUCTS");

    // Lấy State từ Giỏ hàng Zustand
    const {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        customerId,
        setCustomer,
        discountAmount,
        setDiscountAmount,
        couponCode,
        setCoupon,
        couponDiscountAmount,
        surchargeAmount,
        setSurchargeAmount,
        paymentMethod,
        setPaymentMethod,
        note,
        setNote,
        getGrossAmount,
        getNetAmount,
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
            const res = await axiosClient.get(
                `/products/stock-by-warehouse?warehouseId=${warehouseId}`,
            );
            console.log("=== DATA TỪ BACKEND TRẢ VỀ ===", res.data);
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

    const handleAddToCart = (product: Product) => {
        if (product.onHand <= 0) {
            Alert.alert("Hết hàng", "Sản phẩm này đã hết trong kho!");
            return;
        }
        addToCart(product);
    };

    // Customer Search Logic
    const [customerSearchKeyword, setCustomerSearchKeyword] = useState("");
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

    const [couponPreviewLoading, setCouponPreviewLoading] = useState(false);
    const [couponValid, setCouponValid] = useState<boolean | null>(null);
    const [couponMessage, setCouponMessage] = useState("");
    const couponPreviewRequestId = useRef(0);

    const filteredCustomers = customers.filter((c) => {
        if (!customerSearchKeyword) return false;
        const kw = customerSearchKeyword.toLowerCase();
        return (
            c.name.toLowerCase().includes(kw) || (c.phone || "").includes(kw)
        );
    });

    const selectedCustomer = customers.find((c) => c.id === customerId);

    const handleSelectCustomer = (id: string) => {
        setCustomer(id);
        setCustomerSearchKeyword("");
        setIsSearchingCustomer(false);
    };

    const getApiErrorMessage = (error: any): string => {
        return (
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "Đã có lỗi xảy ra"
        );
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
                const res = await axiosClient.get("/orders/coupon-preview", {
                    params: {
                        couponCode: code,
                        grossAmount,
                    },
                });

                if (requestId !== couponPreviewRequestId.current) {
                    return;
                }

                const data = res.data;
                const discount = Number(data?.discountAmount || 0);

                if (data?.valid) {
                    setCoupon(code, discount);
                    setCouponValid(true);
                    setCouponMessage(
                        `Mã hợp lệ: giảm ${discount.toLocaleString("vi-VN")} đ`,
                    );
                } else {
                    setCoupon(code, 0);
                    setCouponValid(false);
                    setCouponMessage(
                        data?.message || "Mã giảm giá không hợp lệ",
                    );
                }
            } catch (error) {
                if (requestId !== couponPreviewRequestId.current) {
                    return;
                }

                setCoupon(code, 0);
                setCouponValid(false);
                setCouponMessage(getApiErrorMessage(error));
            } finally {
                if (requestId === couponPreviewRequestId.current) {
                    setCouponPreviewLoading(false);
                }
            }
        }, 450);

        return () => clearTimeout(debounce);
    }, [couponCode, cart, getGrossAmount, setCoupon]);

    const handleCheckout = async () => {
        if (cart.length === 0) {
            Alert.alert("Lỗi", "Giỏ hàng đang trống!");
            return;
        }
        if (!warehouseId) {
            Alert.alert(
                "Chưa chọn kho",
                "Vui lòng chọn kho xuất hàng trước khi thanh toán!",
            );
            setShowWarehouseModal(true);
            return;
        }

        if (couponCode.trim()) {
            if (couponPreviewLoading) {
                Alert.alert(
                    "Đang kiểm tra",
                    "Vui lòng chờ xác thực mã giảm giá",
                );
                return;
            }
            if (couponValid === false) {
                Alert.alert(
                    "Mã giảm giá không hợp lệ",
                    couponMessage || "Vui lòng kiểm tra lại mã",
                );
                return;
            }
        }

        const payload = {
            customerId: customerId || null,
            warehouseId: warehouseId,
            discountAmount: discountAmount || 0,
            couponCode: couponCode || null,
            surchargeAmount: surchargeAmount || 0,
            paymentMethod: paymentMethod,
            note: note || "",
            items: cart.map((i) => ({
                productId: i.id,
                quantity: i.quantity,
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
            if (!isLargeScreen) setMobileTab("PRODUCTS");

            // Reload lại danh sách sản phẩm theo kho sau khi bán
            fetchProductsByWarehouse();
        } catch (error) {
            console.log("Lỗi thanh toán:", error);
            Alert.alert("Lỗi", getApiErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    // Logic lọc sản phẩm nâng cao (Name, ShortName, SKU, Barcode)
    const filteredProducts = products.filter((p) => {
        // 1. Lọc theo danh mục (category) trước (Vì backend trả về nested category object)
        // Cần extract categoryId từ p.category.id, hoăc fallback p.categoryId nếu mock data
        const itemCategoryId = p.category?.id || p.categoryId;
        const matchCategory =
            activeCategoryId === 0 || itemCategoryId === activeCategoryId;

        // 2. Lọc theo từ khóa
        const kw = searchKeyword.toLowerCase();
        if (!kw) return matchCategory;

        const safeStr = (val: string | undefined | null) =>
            (val || "").toLowerCase();

        const matchSearch =
            safeStr(p.name).includes(kw) ||
            safeStr(p.shortName).includes(kw) ||
            safeStr(p.sku).includes(kw) ||
            safeStr(p.barcode).includes(kw);

        return matchCategory && matchSearch;
    });

    // ========== RENDER MAIN AREAS ========== //

    const renderProductsArea = () => (
        <View style={[styles.productsArea, !isLargeScreen && { flex: 1 }]}>
            {/* Header & Search */}
            <View
                style={[
                    styles.headerArea,
                    !isLargeScreen && {
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 12,
                    },
                ]}
            >
                <Text style={styles.title}>Danh Sách Sản Phẩm</Text>
                <View
                    style={[
                        styles.searchBar,
                        !isLargeScreen && { width: "100%" },
                    ]}
                >
                    <Feather
                        name="search"
                        size={20}
                        color={theme.colors.mutedForeground}
                    />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm theo tên sản phẩm, mã SKU..."
                        placeholderTextColor={theme.colors.mutedForeground}
                        value={searchKeyword}
                        onChangeText={setSearchKeyword}
                    />
                    {searchKeyword.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchKeyword("")}>
                            <Feather
                                name="x-circle"
                                size={18}
                                color={theme.colors.mutedForeground}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Categories Filter */}
            <View style={{ marginBottom: theme.spacing.lg }}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                >
                    {MOCK_CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[
                                styles.categoryChip,
                                activeCategoryId === cat.id &&
                                    styles.categoryChipActive,
                            ]}
                            onPress={() => setActiveCategoryId(cat.id)}
                        >
                            <Text
                                style={[
                                    styles.categoryChipText,
                                    activeCategoryId === cat.id && {
                                        color: theme.colors.primaryForeground,
                                    },
                                ]}
                            >
                                {cat.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Product Grid */}
            {loading ? (
                <View style={styles.loadingCenter}>
                    <ActivityIndicator
                        size="large"
                        color={theme.colors.primary}
                    />
                </View>
            ) : (
                <FlatList
                    data={filteredProducts}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={isLargeScreen ? 4 : 2}
                    key={isLargeScreen ? "cols-4" : "cols-2"} // Bắt buộc đổi key khi đổi số cột FlatList
                    columnWrapperStyle={styles.row}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <Text
                            style={{
                                textAlign: "center",
                                marginTop: 40,
                                color: theme.colors.mutedForeground,
                            }}
                        >
                            Không tìm thấy sản phẩm nào.
                        </Text>
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.productCard,
                                item.onHand <= 0 && { opacity: 0.5 },
                                !isLargeScreen && { maxWidth: "48%" },
                            ]}
                            activeOpacity={0.7}
                            onPress={() => handleAddToCart(item)}
                        >
                            {item.imageUrl ? (
                                <Image
                                    source={{ uri: item.imageUrl }}
                                    style={styles.productImagePlaceholder}
                                />
                            ) : (
                                <View style={styles.productImagePlaceholder}>
                                    <Feather
                                        name="box"
                                        size={32}
                                        color={theme.colors.mutedForeground}
                                    />
                                </View>
                            )}
                            <View style={styles.productInfo}>
                                <Text
                                    style={styles.productName}
                                    numberOfLines={2}
                                >
                                    {item.name}
                                </Text>
                                <Text style={styles.productSku}>
                                    {item.sku}
                                </Text>
                                <View style={styles.productFooter}>
                                    <Text style={styles.productPrice}>
                                        {item.salePrice.toLocaleString("vi-VN")}{" "}
                                        đ
                                    </Text>
                                    <Text
                                        style={[
                                            styles.productStock,
                                            item.onHand <= 0 && {
                                                color: theme.colors.error,
                                                fontWeight: "700",
                                            },
                                        ]}
                                    >
                                        SL: {item.onHand}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );

    const renderCartArea = () => (
        <View
            style={[
                styles.cartArea,
                !isLargeScreen && { flex: 1, borderLeftWidth: 0 },
            ]}
        >
            <View style={styles.cartHeader}>
                <Text style={styles.cartTitle}>
                    Giỏ Hàng {cart.length > 0 && `(${cart.length})`}
                </Text>
                <TouchableOpacity onPress={clearCart}>
                    <Text
                        style={{
                            color: theme.colors.error,
                            fontSize: 14,
                            fontWeight: "600",
                        }}
                    >
                        Xóa hết
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Banner kho đang chọn */}
            <TouchableOpacity
                style={styles.warehouseBanner}
                onPress={() => setShowWarehouseModal(true)}
            >
                <MaterialCommunityIcons
                    name="warehouse"
                    size={16}
                    color={theme.colors.primary}
                />
                <Text style={styles.warehouseBannerText} numberOfLines={1}>
                    {warehouseId
                        ? warehouseName
                        : "Chưa chọn kho — nhấn để chọn"}
                </Text>
                <Feather
                    name="chevron-down"
                    size={14}
                    color={theme.colors.mutedForeground}
                />
            </TouchableOpacity>

            <ScrollView
                style={styles.cartList}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* Customer Selection */}
                <View style={[styles.inputSection, { zIndex: 999 }]}>
                    <Text style={styles.inputLabel}>Khách hàng</Text>
                    {customerId ? (
                        <View style={styles.selectedCustomerBox}>
                            <Text
                                style={styles.selectedCustomerName}
                                numberOfLines={1}
                            >
                                {selectedCustomer?.name || "Khách lẻ"}
                            </Text>
                            <TouchableOpacity onPress={() => setCustomer(null)}>
                                <Feather
                                    name="x-circle"
                                    size={18}
                                    color={theme.colors.mutedForeground}
                                />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={{ zIndex: 999 }}>
                            <View style={styles.searchBarSmall}>
                                <Feather
                                    name="search"
                                    size={18}
                                    color={theme.colors.mutedForeground}
                                />
                                <TextInput
                                    style={styles.searchInputSmall}
                                    placeholder="Tra tên hoặc SDT..."
                                    value={customerSearchKeyword}
                                    onChangeText={(text) => {
                                        setCustomerSearchKeyword(text);
                                        setIsSearchingCustomer(true);
                                    }}
                                    onFocus={() => setIsSearchingCustomer(true)}
                                />
                            </View>
                            {isSearchingCustomer &&
                                customerSearchKeyword.trim() !== "" && (
                                    <View style={styles.customerDropdown}>
                                        {filteredCustomers.length > 0 ? (
                                            filteredCustomers.map((c) => (
                                                <TouchableOpacity
                                                    key={c.id}
                                                    style={
                                                        styles.customerDropdownItem
                                                    }
                                                    onPress={() =>
                                                        handleSelectCustomer(
                                                            c.id,
                                                        )
                                                    }
                                                >
                                                    <Text
                                                        style={{
                                                            fontWeight: "600",
                                                        }}
                                                    >
                                                        {c.name}
                                                    </Text>
                                                    <Text
                                                        style={{
                                                            fontSize: 12,
                                                            color: theme.colors
                                                                .mutedForeground,
                                                        }}
                                                    >
                                                        {c.phone || "—"}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))
                                        ) : (
                                            <Text
                                                style={{
                                                    padding: 12,
                                                    color: theme.colors
                                                        .mutedForeground,
                                                }}
                                            >
                                                Không tìm thấy khách hàng.
                                            </Text>
                                        )}
                                    </View>
                                )}
                        </View>
                    )}
                </View>

                {/* Cart Items List */}
                {cart.length === 0 ? (
                    <View style={{ alignItems: "center", paddingVertical: 40 }}>
                        <Feather
                            name="shopping-cart"
                            size={48}
                            color={theme.colors.muted}
                        />
                        <Text
                            style={{
                                marginTop: 16,
                                color: theme.colors.mutedForeground,
                            }}
                        >
                            Giỏ hàng rỗng
                        </Text>
                    </View>
                ) : (
                    <View style={{ marginBottom: 16 }}>
                        {cart.map((item) => (
                            <View key={item.id} style={styles.cartItem}>
                                <View style={styles.cartItemInfo}>
                                    <Text
                                        style={styles.cartItemName}
                                        numberOfLines={2}
                                    >
                                        {item.name}
                                    </Text>
                                    <Text style={styles.cartItemPrice}>
                                        {item.salePrice.toLocaleString("vi-VN")}{" "}
                                        đ
                                    </Text>
                                </View>
                                <View style={styles.cartItemControls}>
                                    <View style={styles.quantityBox}>
                                        <TouchableOpacity
                                            onPress={() =>
                                                updateQuantity(
                                                    item.id,
                                                    item.quantity - 1,
                                                )
                                            }
                                            style={styles.qtyBtn}
                                        >
                                            <Feather
                                                name="minus"
                                                size={16}
                                                color={theme.colors.foreground}
                                            />
                                        </TouchableOpacity>
                                        <Text style={styles.qtyText}>
                                            {item.quantity}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() =>
                                                updateQuantity(
                                                    item.id,
                                                    item.quantity + 1,
                                                )
                                            }
                                            style={styles.qtyBtn}
                                        >
                                            <Feather
                                                name="plus"
                                                size={16}
                                                color={theme.colors.foreground}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => removeFromCart(item.id)}
                                        style={styles.removeBtn}
                                    >
                                        <Feather
                                            name="x"
                                            size={18}
                                            color={theme.colors.error}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Invoice Modifiers (Giảm giá, Phụ phí, Note) */}
                {cart.length > 0 && (
                    <View style={styles.invoiceModifiers}>
                        {/* Giảm giá / Chiết khấu */}
                        <View style={styles.modifierRow}>
                            <Text style={styles.modifierLabel}>
                                Chiết khấu (VND):
                            </Text>
                            <TextInput
                                style={styles.numericInput}
                                keyboardType="numeric"
                                placeholder="0"
                                value={
                                    discountAmount
                                        ? discountAmount.toString()
                                        : ""
                                }
                                onChangeText={(val) =>
                                    setDiscountAmount(Number(val) || 0)
                                }
                            />
                        </View>
                        {/* Coupon Code */}
                        <View style={styles.modifierRow}>
                            <Text style={styles.modifierLabel}>
                                Mã giảm giá:
                            </Text>
                            <TextInput
                                style={styles.numericInput}
                                placeholder="Nhập mã..."
                                value={couponCode}
                                onChangeText={(val) => {
                                    setCoupon(val, 0);
                                }}
                            />
                        </View>
                        {couponCode.trim().length > 0 && (
                            <Text
                                style={[
                                    styles.couponMessage,
                                    couponValid === true &&
                                        styles.couponMessageValid,
                                    couponValid === false &&
                                        styles.couponMessageInvalid,
                                ]}
                            >
                                {couponPreviewLoading
                                    ? "Đang kiểm tra mã giảm giá..."
                                    : couponMessage ||
                                      `Giảm ${couponDiscountAmount.toLocaleString("vi-VN")} đ`}
                            </Text>
                        )}
                        {/* Phụ phí */}
                        <View style={styles.modifierRow}>
                            <Text style={styles.modifierLabel}>
                                Phụ phí / Ship (VND):
                            </Text>
                            <TextInput
                                style={styles.numericInput}
                                keyboardType="numeric"
                                placeholder="0"
                                value={
                                    surchargeAmount
                                        ? surchargeAmount.toString()
                                        : ""
                                }
                                onChangeText={(val) =>
                                    setSurchargeAmount(Number(val) || 0)
                                }
                            />
                        </View>
                        {/* Ghi chú */}
                        <View style={styles.modifierRow}>
                            <Text style={styles.modifierLabel}>
                                Ghi chú đơn:
                            </Text>
                            <TextInput
                                style={[
                                    styles.numericInput,
                                    { textAlign: "left" },
                                ]}
                                placeholder="Nhập ghi chú..."
                                value={note}
                                onChangeText={setNote}
                            />
                        </View>
                    </View>
                )}

                {/* Payment Methods */}
                {cart.length > 0 && (
                    <View style={styles.inputSection}>
                        <Text style={styles.inputLabel}>
                            Hình thức Thanh toán
                        </Text>
                        <View style={styles.paymentMethodRow}>
                            {["CASH", "TRANSFER", "MIX", "DEBT"].map(
                                (method) => (
                                    <TouchableOpacity
                                        key={method}
                                        style={[
                                            styles.paymentBtn,
                                            paymentMethod === method &&
                                                styles.paymentBtnActive,
                                        ]}
                                        onPress={() => setPaymentMethod(method)}
                                    >
                                        <Text
                                            style={
                                                paymentMethod === method
                                                    ? {
                                                          color: "#fff",
                                                          fontSize: 12,
                                                          fontWeight: "700",
                                                      }
                                                    : {
                                                          fontSize: 12,
                                                          color: theme.colors
                                                              .foreground,
                                                          fontWeight: "500",
                                                      }
                                            }
                                        >
                                            {method === "CASH"
                                                ? "Tiền mặt"
                                                : method === "TRANSFER"
                                                  ? "C/K"
                                                  : method === "MIX"
                                                    ? "Mix"
                                                    : "Ghi Nợ"}
                                        </Text>
                                    </TouchableOpacity>
                                ),
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Bill Footer */}
            <View style={styles.cartFooter}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tổng tiền hàng</Text>
                    <Text style={styles.summaryValue}>
                        {getGrossAmount().toLocaleString("vi-VN")} đ
                    </Text>
                </View>
                {(discountAmount > 0 || couponCode.length > 0) && (
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tiền giảm giá</Text>
                        <Text
                            style={[
                                styles.summaryValue,
                                { color: theme.colors.error },
                            ]}
                        >
                            -{" "}
                            {(
                                discountAmount + couponDiscountAmount
                            ).toLocaleString("vi-VN")}{" "}
                            đ
                        </Text>
                    </View>
                )}
                {surchargeAmount > 0 && (
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Phí khác</Text>
                        <Text style={styles.summaryValue}>
                            + {surchargeAmount.toLocaleString("vi-VN")} đ
                        </Text>
                    </View>
                )}
                <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                    <Text style={styles.totalLabel}>Khách Cần Trả</Text>
                    <Text style={styles.totalValue}>
                        {getNetAmount().toLocaleString("vi-VN")} đ
                    </Text>
                </View>

                <TouchableOpacity
                    style={[
                        styles.checkoutBtn,
                        cart.length === 0 && { opacity: 0.5 },
                    ]}
                    onPress={handleCheckout}
                    disabled={cart.length === 0}
                >
                    <Text style={styles.checkoutBtnText}>
                        Xác nhận Thanh toán
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // ===================== WAREHOUSE SELECTION MODAL ===================== //
    const renderWarehouseModal = () => (
        <View
            style={[
                styles.modalOverlay,
                !showWarehouseModal && { display: "none" },
            ]}
        >
            <View style={styles.modalBox}>
                <View style={styles.modalHeader}>
                    <MaterialCommunityIcons
                        name="warehouse"
                        size={28}
                        color={theme.colors.primary}
                    />
                    <Text style={styles.modalTitle}>Chọn Kho Xuất Hàng</Text>
                </View>
                <Text style={styles.modalSubtitle}>
                    Vui lòng chọn kho trước khi bắt đầu bán hàng
                </Text>
                <View style={styles.warehouseList}>
                    {warehouses.length === 0 ? (
                        <ActivityIndicator color={theme.colors.primary} />
                    ) : (
                        warehouses
                            .filter((w) => w.isActive)
                            .map((w) => (
                                <TouchableOpacity
                                    key={w.id}
                                    style={[
                                        styles.warehouseItem,
                                        warehouseId === w.id &&
                                            styles.warehouseItemActive,
                                    ]}
                                    onPress={() => {
                                        setWarehouseId(w.id);
                                        setWarehouseName(w.name);
                                        setShowWarehouseModal(false);
                                    }}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={[
                                                styles.warehouseItemName,
                                                warehouseId === w.id && {
                                                    color: theme.colors.primary,
                                                },
                                            ]}
                                        >
                                            {w.name}
                                        </Text>
                                        {w.address ? (
                                            <Text
                                                style={
                                                    styles.warehouseItemAddress
                                                }
                                                numberOfLines={1}
                                            >
                                                {w.address}
                                            </Text>
                                        ) : null}
                                    </View>
                                    {warehouseId === w.id && (
                                        <Feather
                                            name="check-circle"
                                            size={20}
                                            color={theme.colors.primary}
                                        />
                                    )}
                                </TouchableOpacity>
                            ))
                    )}
                </View>
                {warehouseId && (
                    <TouchableOpacity
                        style={styles.modalConfirmBtn}
                        onPress={() => setShowWarehouseModal(false)}
                    >
                        <Text style={styles.modalConfirmBtnText}>Xác nhận</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <View
            style={[
                styles.container,
                { flexDirection: isLargeScreen ? "row" : "column" },
            ]}
        >
            {/* Mobile Tab Switcher */}
            {!isLargeScreen && (
                <View style={styles.mobileTabWrapper}>
                    <TouchableOpacity
                        style={[
                            styles.mobileTabBtn,
                            mobileTab === "PRODUCTS" &&
                                styles.mobileTabBtnActive,
                        ]}
                        onPress={() => setMobileTab("PRODUCTS")}
                    >
                        <Text
                            style={[
                                styles.mobileTabText,
                                mobileTab === "PRODUCTS" && {
                                    color: theme.colors.primary,
                                },
                            ]}
                        >
                            HÀNG HÓA
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.mobileTabBtn,
                            mobileTab === "CART" && styles.mobileTabBtnActive,
                        ]}
                        onPress={() => setMobileTab("CART")}
                    >
                        <Text
                            style={[
                                styles.mobileTabText,
                                mobileTab === "CART" && {
                                    color: theme.colors.primary,
                                },
                            ]}
                        >
                            GIỎ HÀNG {cart.length > 0 && `(${cart.length})`}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Tùy kích thước hiển thị Flex-Row hay Flex-Column */}
            {isLargeScreen ? (
                <>
                    {renderProductsArea()}
                    {renderCartArea()}
                </>
            ) : // Mobile View
            mobileTab === "PRODUCTS" ? (
                renderProductsArea()
            ) : (
                renderCartArea()
            )}

            {/* Warehouse Selection Modal (hiện trên cùng) */}
            {renderWarehouseModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    productsArea: {
        flex: 6.5,
        padding: theme.spacing.lg,
    },
    cartArea: {
        flex: 3.5,
        backgroundColor: theme.colors.surface,
        borderLeftWidth: 1,
        borderLeftColor: theme.colors.border,
    },
    mobileTabWrapper: {
        flexDirection: "row",
        backgroundColor: theme.colors.surface,
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    mobileTabBtn: {
        flex: 1,
        paddingVertical: 14,
        alignItems: "center",
        borderBottomWidth: 3,
        borderBottomColor: "transparent",
    },
    mobileTabBtnActive: {
        borderBottomColor: theme.colors.primary,
    },
    mobileTabText: {
        fontWeight: "700",
        color: theme.colors.mutedForeground,
    },

    // Products Header
    headerArea: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: theme.spacing.md,
    },
    title: {
        ...theme.typography.h3,
        color: theme.colors.foreground,
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.colors.surface,
        paddingHorizontal: theme.spacing.md,
        height: 40,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: theme.colors.border,
        width: 350,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        height: "100%",
        color: theme.colors.foreground,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    categoryChipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    categoryChipText: {
        fontWeight: "500",
        color: theme.colors.foreground,
    },

    // Grid
    loadingCenter: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    row: {
        justifyContent: "space-between",
        marginBottom: 16,
    },
    productCard: {
        flex: 1,
        maxWidth: "24%", // Sẽ bị override tuỳ cols
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: "hidden",
        shadowColor: theme.colors.foreground,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    productImagePlaceholder: {
        height: 140,
        backgroundColor: theme.colors.muted,
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
    },
    productInfo: {
        padding: theme.spacing.sm,
    },
    productName: {
        ...theme.typography.caption,
        fontWeight: "600",
        color: theme.colors.foreground,
        height: 40,
    },
    productSku: {
        fontSize: 12,
        color: theme.colors.mutedForeground,
        marginTop: 4,
    },
    productFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginTop: 12,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: "700",
        color: theme.colors.primary,
    },
    productStock: {
        fontSize: 12,
        color: theme.colors.foreground,
    },

    // Cart Area
    cartHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    cartTitle: {
        ...theme.typography.h3,
        color: theme.colors.foreground,
    },
    cartList: {
        flex: 1,
        padding: theme.spacing.md,
    },

    // Custom Inputs
    inputSection: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: theme.colors.mutedForeground,
        textTransform: "uppercase",
        marginBottom: 8,
    },
    customerChipsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    searchBarSmall: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.full, // Thay đổi bo tròn giống search Sản Phẩm
        paddingHorizontal: 16, // Thanh này mềm mại hơn
        height: 40,
    },
    searchInputSmall: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: theme.colors.foreground,
    },
    customerDropdown: {
        position: "absolute",
        top: 44, // dời xuống 1 chút
        left: 0,
        right: 0,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        maxHeight: 180,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 20 /* Highest elevation for Android */,
        zIndex: 9999 /* Ensure overlay works on web/iOS */,
    },
    customerDropdownItem: {
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: "#ffffff",
    },
    selectedCustomerBox: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: 16,
        height: 40,
        borderRadius: theme.borderRadius.full, // Bắt chước Search bar mềm mại
    },
    selectedCustomerName: {
        fontWeight: "600",
        color: theme.colors.foreground,
        flex: 1,
    },
    customerChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    customerChipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },

    // Cart Item
    cartItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    cartItemInfo: {
        flex: 1,
        marginRight: 10,
    },
    cartItemName: {
        fontSize: 14,
        fontWeight: "600",
        color: theme.colors.foreground,
        marginBottom: 4,
    },
    cartItemPrice: {
        fontSize: 14,
        color: theme.colors.primary,
        fontWeight: "700",
    },
    cartItemControls: {
        justifyContent: "space-between",
        alignItems: "flex-end",
    },
    quantityBox: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: theme.colors.background,
    },
    qtyBtn: { padding: 6 },
    qtyText: {
        fontSize: 13,
        fontWeight: "600",
        minWidth: 20,
        textAlign: "center",
    },
    removeBtn: { marginTop: 12 },

    // Invoice Modifiers
    invoiceModifiers: {
        backgroundColor: "#f8fafc",
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: 16,
        gap: 8,
    },
    modifierRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    modifierLabel: {
        fontSize: 13,
        color: theme.colors.foreground,
        flex: 1,
    },
    numericInput: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 4,
        width: 120,
        height: 32,
        paddingHorizontal: 8,
        backgroundColor: "#fff",
        textAlign: "right",
    },
    couponMessage: {
        fontSize: 12,
        color: theme.colors.mutedForeground,
        marginTop: -2,
    },
    couponMessageValid: {
        color: theme.colors.primary,
    },
    couponMessageInvalid: {
        color: theme.colors.error,
    },

    paymentMethodRow: {
        flexDirection: "row",
        gap: 8,
    },
    paymentBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 8,
        backgroundColor: theme.colors.surface,
    },
    paymentBtnActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },

    // Footer
    cartFooter: {
        padding: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: "#f1f5f9",
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    summaryLabel: { color: theme.colors.mutedForeground, fontSize: 14 },
    summaryValue: {
        color: theme.colors.foreground,
        fontWeight: "600",
        fontSize: 14,
    },
    summaryTotalRow: {
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        borderStyle: "dashed",
        marginBottom: 16,
    },
    totalLabel: {
        color: theme.colors.foreground,
        fontWeight: "700",
        fontSize: 16,
    },
    totalValue: {
        color: theme.colors.primary,
        fontWeight: "800",
        fontSize: 22,
    },
    checkoutBtn: {
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        alignItems: "center",
    },
    checkoutBtnText: {
        color: theme.colors.primaryForeground,
        fontWeight: "bold",
        fontSize: 16,
        textTransform: "uppercase",
    },

    // ── Warehouse Banner ──
    warehouseBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 8,
        backgroundColor: theme.colors.primaryLight,
        borderBottomWidth: 1,
        borderBottomColor: "#a7f3d0",
    },
    warehouseBannerText: {
        flex: 1,
        fontSize: 13,
        fontWeight: "600",
        color: theme.colors.primary,
    },

    // ── Warehouse Modal ──
    modalOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
    },
    modalBox: {
        backgroundColor: "#fff",
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.xl,
        width: "90%",
        maxWidth: 480,
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 20,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: theme.colors.foreground,
    },
    modalSubtitle: {
        fontSize: 14,
        color: theme.colors.mutedForeground,
        marginBottom: theme.spacing.lg,
    },
    warehouseList: {
        gap: 8,
        marginBottom: theme.spacing.lg,
    },
    warehouseItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    warehouseItemActive: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryLight,
    },
    warehouseItemName: {
        fontSize: 15,
        fontWeight: "600",
        color: theme.colors.foreground,
        marginBottom: 2,
    },
    warehouseItemAddress: {
        fontSize: 12,
        color: theme.colors.mutedForeground,
    },
    modalConfirmBtn: {
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        alignItems: "center",
    },
    modalConfirmBtnText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 15,
    },
});

export default PosScreen;
