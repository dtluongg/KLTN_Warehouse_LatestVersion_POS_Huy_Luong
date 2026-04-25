import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    FlatList,
    Modal,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { axiosClient } from "../../../api/axiosClient";
import { theme } from "../../../utils/theme";

const DISCOUNT_TYPES = [
    { value: "PERCENT", label: "Phần trăm (%)" },
    { value: "FIXED", label: "Số tiền cố định (VND)" },
];

const CouponFormScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const editId: number | undefined = route.params?.id;
    const isEdit = !!editId;

    const [code, setCode] = useState("");
    const [discountType, setDiscountType] = useState("PERCENT");
    const [discountValue, setDiscountValue] = useState("");
    const [minOrderAmount, setMinOrderAmount] = useState("");
    const [maxDiscountAmount, setMaxDiscountAmount] = useState("");
    const [startsAt, setStartsAt] = useState("");
    const [endsAt, setEndsAt] = useState("");
    const [usageLimit, setUsageLimit] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [showTypeModal, setShowTypeModal] = useState(false);

    useEffect(() => {
        if (!isEdit) return;
        const load = async () => {
            try {
                const res = await axiosClient.get(`/coupons/${editId}`);
                setCode(res.data.code || "");
                setDiscountType(res.data.discountType || "PERCENT");
                setDiscountValue(String(res.data.discountValue ?? ""));
                setMinOrderAmount(String(res.data.minOrderAmount ?? ""));
                setMaxDiscountAmount(String(res.data.maxDiscountAmount ?? ""));
                setStartsAt(
                    res.data.startsAt ? res.data.startsAt.substring(0, 10) : "",
                );
                setEndsAt(
                    res.data.endsAt ? res.data.endsAt.substring(0, 10) : "",
                );
                setUsageLimit(String(res.data.usageLimit ?? ""));
                setIsActive(res.data.isActive ?? true);
            } catch {
                Alert.alert("Lỗi", "Không thể tải dữ liệu coupon.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [editId]);

    const handleSubmit = async () => {
        if (!code.trim()) {
            Alert.alert("Thiếu thông tin", "Vui lòng nhập mã coupon.");
            return;
        }
        if (!discountValue) {
            Alert.alert("Thiếu thông tin", "Vui lòng nhập giá trị giảm.");
            return;
        }
        const payload = {
            code: code.trim().toUpperCase(),
            discountType,
            discountValue: Number(discountValue) || 0,
            minOrderAmount: minOrderAmount ? Number(minOrderAmount) : null,
            maxDiscountAmount: maxDiscountAmount
                ? Number(maxDiscountAmount)
                : null,
            startsAt: startsAt ? `${startsAt}T00:00:00` : null,
            endsAt: endsAt ? `${endsAt}T23:59:59` : null,
            usageLimit: usageLimit ? Number(usageLimit) : null,
            isActive,
        };
        try {
            setSubmitting(true);
            if (isEdit) {
                await axiosClient.put(`/coupons/${editId}`, payload);
                Alert.alert("Thành công", "Đã cập nhật mã giảm giá.");
            } else {
                await axiosClient.post("/coupons", payload);
                Alert.alert("Thành công", "Đã tạo mã giảm giá mới.");
            }
            navigation.goBack();
        } catch (err: any) {
            Alert.alert(
                "Lỗi",
                err?.response?.data?.message || "Không thể lưu coupon.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    const selectedTypeLabel =
        DISCOUNT_TYPES.find((t) => t.value === discountType)?.label ||
        discountType;
    const valuePlaceholder =
        discountType === "PERCENT"
            ? "Ví dụ: 10 (= 10%)"
            : "Ví dụ: 50000 (= 50,000 VND)";

    if (loading) {
        return (
            <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                >
                    <Feather
                        name="arrow-left"
                        size={22}
                        color={theme.colors.foreground}
                    />
                </TouchableOpacity>
                <Text style={styles.title}>
                    {isEdit ? "Sửa mã giảm giá" : "Thêm mã giảm giá"}
                </Text>
            </View>

            <ScrollView
                style={styles.body}
                contentContainerStyle={{ paddingBottom: 120 }}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        Thông tin mã giảm giá
                    </Text>

                    <Text style={styles.label}>
                        Mã coupon <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={code}
                        onChangeText={(v) => setCode(v.toUpperCase())}
                        placeholder="SUMMER10"
                        placeholderTextColor={theme.colors.mutedForeground}
                        autoCapitalize="characters"
                    />

                    <Text style={styles.label}>
                        Loại giảm giá <Text style={styles.required}>*</Text>
                    </Text>
                    <TouchableOpacity
                        style={styles.picker}
                        onPress={() => setShowTypeModal(true)}
                    >
                        <Feather
                            name="tag"
                            size={16}
                            color={theme.colors.mutedForeground}
                        />
                        <Text style={styles.pickerText}>
                            {selectedTypeLabel}
                        </Text>
                        <Feather
                            name="chevron-down"
                            size={16}
                            color={theme.colors.mutedForeground}
                        />
                    </TouchableOpacity>

                    <Text style={styles.label}>
                        Giá trị giảm <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={discountValue}
                        onChangeText={setDiscountValue}
                        placeholder={valuePlaceholder}
                        placeholderTextColor={theme.colors.mutedForeground}
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Điều kiện áp dụng</Text>

                    <View style={styles.rowInputs}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>
                                Đơn tối thiểu (VND)
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={minOrderAmount}
                                onChangeText={setMinOrderAmount}
                                placeholder="0"
                                placeholderTextColor={
                                    theme.colors.mutedForeground
                                }
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Giảm tối đa (VND)</Text>
                            <TextInput
                                style={styles.input}
                                value={maxDiscountAmount}
                                onChangeText={setMaxDiscountAmount}
                                placeholder="Không giới hạn"
                                placeholderTextColor={
                                    theme.colors.mutedForeground
                                }
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    <View style={styles.rowInputs}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Ngày bắt đầu</Text>
                            <TextInput
                                style={styles.input}
                                value={startsAt}
                                onChangeText={setStartsAt}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={
                                    theme.colors.mutedForeground
                                }
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Ngày kết thúc</Text>
                            <TextInput
                                style={styles.input}
                                value={endsAt}
                                onChangeText={setEndsAt}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={
                                    theme.colors.mutedForeground
                                }
                            />
                        </View>
                    </View>

                    <Text style={styles.label}>Giới hạn số lần dùng</Text>
                    <TextInput
                        style={styles.input}
                        value={usageLimit}
                        onChangeText={setUsageLimit}
                        placeholder="Để trống = không giới hạn"
                        placeholderTextColor={theme.colors.mutedForeground}
                        keyboardType="numeric"
                    />

                    <View style={styles.switchRow}>
                        <Text style={styles.label}>Đang kích hoạt</Text>
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => setIsActive((prev) => !prev)}
                            accessibilityRole="switch"
                            accessibilityState={{ checked: isActive }}
                            style={[
                                styles.toggleTrack,
                                isActive && styles.toggleTrackOn,
                            ]}
                        >
                            <View
                                style={[
                                    styles.toggleThumb,
                                    isActive && styles.toggleThumbOn,
                                ]}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.submitBtn,
                        submitting && styles.submitBtnDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Feather name="save" size={18} color="#fff" />
                    )}
                    <Text style={styles.submitBtnText}>
                        {submitting
                            ? "Đang lưu..."
                            : isEdit
                              ? "Cập nhật"
                              : "Tạo mã giảm giá"}
                    </Text>
                </TouchableOpacity>
            </View>

            <Modal
                visible={showTypeModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowTypeModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Loại giảm giá</Text>
                            <TouchableOpacity
                                onPress={() => setShowTypeModal(false)}
                            >
                                <Feather
                                    name="x"
                                    size={22}
                                    color={theme.colors.foreground}
                                />
                            </TouchableOpacity>
                        </View>
                        {DISCOUNT_TYPES.map((t) => (
                            <TouchableOpacity
                                key={t.value}
                                style={[
                                    styles.modalItem,
                                    t.value === discountType &&
                                        styles.modalItemSelected,
                                ]}
                                onPress={() => {
                                    setDiscountType(t.value);
                                    setShowTypeModal(false);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.modalItemName,
                                        t.value === discountType && {
                                            color: theme.colors.primary,
                                        },
                                    ]}
                                >
                                    {t.label}
                                </Text>
                                {t.value === discountType && (
                                    <Feather
                                        name="check"
                                        size={16}
                                        color={theme.colors.primary}
                                    />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    loadingBox: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
    },
    loadingText: { color: theme.colors.mutedForeground, fontSize: 14 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingTop: 54,
        paddingBottom: 16,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backBtn: { padding: 4 },
    title: { fontSize: 18, fontWeight: "700", color: theme.colors.foreground },
    body: { flex: 1 },
    card: {
        backgroundColor: theme.colors.surface,
        margin: 16,
        marginBottom: 0,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: theme.colors.foreground,
        marginBottom: 14,
    },
    label: {
        fontSize: 13,
        fontWeight: "600",
        color: theme.colors.mutedForeground,
        marginBottom: 6,
        marginTop: 12,
    },
    required: { color: theme.colors.error },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: theme.colors.foreground,
        backgroundColor: theme.colors.background,
    },
    rowInputs: { flexDirection: "row", gap: 12 },
    picker: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 11,
        backgroundColor: theme.colors.background,
    },
    pickerText: { flex: 1, fontSize: 14, color: theme.colors.foreground },
    switchRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 16,
    },
    toggleTrack: {
        width: 44,
        height: 26,
        borderRadius: 13,
        backgroundColor: theme.colors.border,
        padding: 2,
        justifyContent: "center",
    },
    toggleTrackOn: {
        backgroundColor: theme.colors.primary,
    },
    toggleThumb: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: "#ffffff",
        transform: [{ translateX: 0 }],
    },
    toggleThumbOn: {
        transform: [{ translateX: 18 }],
    },
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    submitBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: theme.colors.primary,
        borderRadius: 12,
        paddingVertical: 16,
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalBox: {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: theme.colors.foreground,
    },
    modalItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    modalItemSelected: { backgroundColor: `${theme.colors.primary}10` },
    modalItemName: { fontSize: 15, color: theme.colors.foreground },
});

export default CouponFormScreen;
