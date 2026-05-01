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
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { axiosClient } from "../../../api/axiosClient";
import { theme } from "../../../utils/theme";
import { showAlert } from "../../../utils/alerts";

const WarehouseFormScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const editId: number | undefined = route.params?.id;
    const isEdit = !!editId;

    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isEdit) return;
        const load = async () => {
            try {
                const res = await axiosClient.get(`/warehouses/${editId}`);
                setCode(res.data.code || "");
                setName(res.data.name || "");
                setAddress(res.data.address || "");
                setIsActive(res.data.isActive ?? true);
            } catch {
                showAlert("Lỗi", "Không thể tải dữ liệu kho hàng.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [editId]);

    const handleSubmit = async () => {
        if (!code.trim()) {
            showAlert("Thiếu thông tin", "Vui lòng nhập mã kho.");
            return;
        }
        if (!name.trim()) {
            showAlert("Thiếu thông tin", "Vui lòng nhập tên kho.");
            return;
        }
        const payload = {
            code: code.trim(),
            name: name.trim(),
            address: address.trim() || null,
            isActive,
        };
        try {
            setSubmitting(true);
            if (isEdit) {
                await axiosClient.put(`/warehouses/${editId}`, payload);
                showAlert("Thành công", "Đã cập nhật kho hàng.");
            } else {
                await axiosClient.post("/warehouses", payload);
                showAlert("Thành công", "Đã tạo kho hàng mới.");
            }
            navigation.goBack();
        } catch (err: any) {
            showAlert(
                "Lỗi",
                err?.response?.data?.message || "Không thể lưu kho hàng.",
            );
        } finally {
            setSubmitting(false);
        }
    };

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
                    {isEdit ? "Sửa kho hàng" : "Thêm kho hàng"}
                </Text>
            </View>

            <ScrollView
                style={styles.body}
                contentContainerStyle={{ paddingBottom: 120 }}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Thông tin kho hàng</Text>

                    <Text style={styles.label}>
                        Mã kho <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={code}
                        onChangeText={setCode}
                        placeholder="KHO-001"
                        placeholderTextColor={theme.colors.mutedForeground}
                        autoCapitalize="characters"
                    />

                    <Text style={styles.label}>
                        Tên kho <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Kho Chính - Vĩnh Long"
                        placeholderTextColor={theme.colors.mutedForeground}
                    />

                    <Text style={styles.label}>Địa chỉ</Text>
                    <TextInput
                        style={[styles.input, styles.inputMultiline]}
                        value={address}
                        onChangeText={setAddress}
                        placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                        placeholderTextColor={theme.colors.mutedForeground}
                        multiline
                        numberOfLines={3}
                    />

                    <View style={styles.switchRow}>
                        <Text style={styles.label}>Đang hoạt động</Text>
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
                              : "Tạo kho hàng"}
                    </Text>
                </TouchableOpacity>
            </View>
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
    inputMultiline: { height: 80, textAlignVertical: "top" },
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
});

export default WarehouseFormScreen;
