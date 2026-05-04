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

const CategoryFormScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const editId: number | undefined = route.params?.id;
    const isEdit = !!editId;

    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);

    // Auto-generate slug from name
    const generateSlug = (val: string) =>
        val
            .toLowerCase()
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-");

    const handleNameChange = (val: string) => {
        setName(val);
        if (!isEdit) setSlug(generateSlug(val));
    };

    useEffect(() => {
        if (!isEdit) return;
        const load = async () => {
            try {
                const res = await axiosClient.get(`/categories/${editId}`);
                setName(res.data.name || "");
                setSlug(res.data.slug || "");
                setIsActive(res.data.isActive ?? true);
            } catch {
                showAlert("Lỗi", "Không thể tải dữ liệu danh mục.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [editId]);

    const handleSubmit = async () => {
        if (!name.trim()) {
            showAlert("Thiếu thông tin", "Vui lòng nhập tên danh mục.");
            return;
        }
        if (!slug.trim()) {
            showAlert("Thiếu thông tin", "Vui lòng nhập slug.");
            return;
        }
        const payload = { name: name.trim(), slug: slug.trim(), isActive };
        try {
            setSubmitting(true);
            if (isEdit) {
                await axiosClient.put(`/categories/${editId}`, payload);
                showAlert("Thành công", "Đã cập nhật danh mục.");
            } else {
                await axiosClient.post("/categories", payload);
                showAlert("Thành công", "Đã tạo danh mục mới.");
            }
            navigation.goBack();
        } catch (err: any) {
            showAlert(
                "Lỗi",
                err?.response?.data?.message || "Không thể lưu danh mục.",
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
            {/* Header */}
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
                    {isEdit ? "Sửa danh mục" : "Thêm danh mục"}
                </Text>
            </View>

            <ScrollView
                style={styles.body}
                contentContainerStyle={{ paddingBottom: 120 }}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Thông tin danh mục</Text>

                    <Text style={styles.label}>
                        Tên danh mục <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={handleNameChange}
                        placeholder="Ví dụ: Thuốc bảo vệ thực vật"
                        placeholderTextColor={theme.colors.mutedForeground}
                    />

                    <Text style={styles.label}>
                        Slug (đường dẫn) <Text style={styles.required}>*</Text>
                    </Text>
                    <View style={styles.inputWithBtn}>
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            value={slug}
                            onChangeText={setSlug}
                            placeholder="thuoc-bao-ve-thuc-vat"
                            placeholderTextColor={theme.colors.mutedForeground}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity
                            style={styles.genBtn}
                            onPress={() => setSlug(generateSlug(name))}
                        >
                            <Feather
                                name="zap"
                                size={14}
                                color={theme.colors.primary}
                            />
                            <Text style={styles.genBtnText}>Tự sinh</Text>
                        </TouchableOpacity>
                    </View>

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
                              : "Tạo danh mục"}
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
    switchRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 16,
    },
    inputWithBtn: { flexDirection: "row", gap: 6, alignItems: "center" },
    genBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    genBtnText: {
        fontSize: 12,
        color: theme.colors.primary,
        fontWeight: "600",
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
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

export default CategoryFormScreen;
