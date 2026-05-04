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
    Image,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { axiosClient } from "../../../api/axiosClient";
import { uploadProductImageToSupabase } from "../../../api/supabaseStorage";
import { theme } from "../../../utils/theme";
import { showAlert } from "../../../utils/alerts";

interface Category {
    id: number;
    name: string;
}

const ProductFormScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const editId: number | undefined = route.params?.id;
    const isEdit = !!editId;

    const [sku, setSku] = useState("");
    const [barcode, setBarcode] = useState("");
    const [name, setName] = useState("");
    const [shortName, setShortName] = useState("");
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [categoryName, setCategoryName] = useState("");
    const [salePrice, setSalePrice] = useState("");
    const [vatRate, setVatRate] = useState("0");
    const [imageUrl, setImageUrl] = useState("");
    const [localImageUri, setLocalImageUri] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [isActive, setIsActive] = useState(true);

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [categorySearch, setCategorySearch] = useState("");

    // Tự sinh SKU dựa vào tên sản phẩm + timestamp ngắn
    const generateSku = () => {
        const base =
            name
                .trim()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/đ/g, "d")
                .replace(/Đ/g, "D")
                .replace(/[^a-zA-Z0-9\s]/g, "")
                .trim()
                .split(/\s+/)
                .map((w) => w[0]?.toUpperCase() || "")
                .join("") || "SP";
        const rand = Date.now().toString(36).toUpperCase().slice(-4);
        setSku(`${base}-${rand}`);
    };

    useEffect(() => {
        const load = async () => {
            try {
                const catRes = await axiosClient.get(
                    "/categories?size=200&isActive=true",
                );
                setCategories(catRes.data.content || []);

                if (isEdit) {
                    const res = await axiosClient.get(`/products/${editId}`);
                    setSku(res.data.sku || "");
                    setBarcode(res.data.barcode || "");
                    setName(res.data.name || "");
                    setShortName(res.data.shortName || "");
                    setCategoryId(res.data.categoryId || null);
                    setCategoryName(res.data.categoryName || "");
                    setSalePrice(String(res.data.salePrice ?? ""));
                    setVatRate(String(res.data.vatRate ?? "0"));
                    setImageUrl(res.data.imageUrl || "");
                    setIsActive(res.data.isActive ?? true);
                }
            } catch (e) {
                showAlert("Lỗi", "Không thể tải dữ liệu.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [editId]);

    const handlePickAndUploadImage = async () => {
        try {
            const permission =
                await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                showAlert(
                    "Thiếu quyền",
                    "Vui lòng cấp quyền truy cập thư viện ảnh để chọn ảnh sản phẩm.",
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.85,
            });

            if (result.canceled || !result.assets?.length) {
                return;
            }

            const asset = result.assets[0];
            setLocalImageUri(asset.uri);
            setUploadingImage(true);

            const publicUrl = await uploadProductImageToSupabase({
                uri: asset.uri,
                fileName: asset.fileName ?? undefined,
                mimeType: asset.mimeType ?? undefined,
                sku: sku.trim(),
                productName: name.trim(),
            });

            setImageUrl(publicUrl);
            showAlert("Thành công", "Đã upload ảnh sản phẩm lên Supabase.");
        } catch (err: any) {
            setLocalImageUri(null);
            showAlert(
                "Lỗi",
                err?.message || "Không thể upload ảnh sản phẩm.",
            );
        } finally {
            setUploadingImage(false);
        }
    };

    const handleClearImage = () => {
        setLocalImageUri(null);
        setImageUrl("");
    };

    const handleSubmit = async () => {
        if (!sku.trim()) {
            showAlert("Thiếu thông tin", "Vui lòng nhập mã SKU.");
            return;
        }
        if (!name.trim()) {
            showAlert("Thiếu thông tin", "Vui lòng nhập tên sản phẩm.");
            return;
        }
        if (!categoryId) {
            showAlert("Thiếu thông tin", "Vui lòng chọn danh mục.");
            return;
        }
        if (!salePrice || Number(salePrice) < 0) {
            showAlert("Thiếu thông tin", "Vui lòng nhập giá bán hợp lệ.");
            return;
        }

        const payload = {
            sku: sku.trim(),
            barcode: barcode.trim() || null,
            name: name.trim(),
            shortName: shortName.trim() || null,
            categoryId,
            salePrice: Number(salePrice),
            vatRate: Number(vatRate) || 0,
            imageUrl: imageUrl.trim() || null,
            isActive,
        };
        try {
            setSubmitting(true);
            if (isEdit) {
                await axiosClient.put(`/products/${editId}`, payload);
                showAlert("Thành công", "Đã cập nhật sản phẩm.");
            } else {
                await axiosClient.post("/products", payload);
                showAlert("Thành công", "Đã tạo sản phẩm mới.");
            }
            navigation.goBack();
        } catch (err: any) {
            showAlert(
                "Lỗi",
                err?.response?.data?.message || "Không thể lưu sản phẩm.",
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
                    {isEdit ? "Sửa sản phẩm" : "Thêm sản phẩm"}
                </Text>
            </View>

            <ScrollView
                style={styles.body}
                contentContainerStyle={{ paddingBottom: 120 }}
                keyboardShouldPersistTaps="handled"
            >
                {/* Định danh */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Thông tin định danh</Text>

                    <View style={styles.rowInputs}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>
                                Mã SKU <Text style={styles.required}>*</Text>
                            </Text>
                            <View style={styles.inputWithBtn}>
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    value={sku}
                                    onChangeText={setSku}
                                    placeholder="SP-001"
                                    placeholderTextColor={
                                        theme.colors.mutedForeground
                                    }
                                    autoCapitalize="characters"
                                />
                                <TouchableOpacity
                                    style={styles.genBtn}
                                    onPress={generateSku}
                                >
                                    <Feather
                                        name="zap"
                                        size={14}
                                        color={theme.colors.primary}
                                    />
                                    <Text style={styles.genBtnText}>
                                        Tự sinh
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Mã vạch (Barcode)</Text>
                            <TextInput
                                style={styles.input}
                                value={barcode}
                                onChangeText={setBarcode}
                                placeholder="8935xxx"
                                placeholderTextColor={
                                    theme.colors.mutedForeground
                                }
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    <Text style={styles.label}>
                        Tên sản phẩm <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Tên sản phẩm đầy đủ"
                        placeholderTextColor={theme.colors.mutedForeground}
                    />

                    <Text style={styles.label}>Tên viết tắt / thương hiệu</Text>
                    <TextInput
                        style={styles.input}
                        value={shortName}
                        onChangeText={setShortName}
                        placeholder="Tên ngắn gọn hiển thị trên hóa đơn"
                        placeholderTextColor={theme.colors.mutedForeground}
                    />

                    <Text style={styles.label}>
                        Danh mục <Text style={styles.required}>*</Text>
                    </Text>
                    <TouchableOpacity
                        style={styles.picker}
                        onPress={() => setShowCategoryModal(true)}
                    >
                        <Feather
                            name="grid"
                            size={16}
                            color={theme.colors.mutedForeground}
                        />
                        <Text
                            style={[
                                styles.pickerText,
                                !categoryId && styles.pickerPlaceholder,
                            ]}
                        >
                            {categoryName || "Chọn danh mục..."}
                        </Text>
                        <Feather
                            name="chevron-down"
                            size={16}
                            color={theme.colors.mutedForeground}
                        />
                    </TouchableOpacity>
                </View>

                {/* Giá cả */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Giá & Thuế</Text>

                    <View style={styles.rowInputs}>
                        <View style={{ flex: 2 }}>
                            <Text style={styles.label}>
                                Giá bán (VND){" "}
                                <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={salePrice}
                                onChangeText={setSalePrice}
                                placeholder="0"
                                placeholderTextColor={
                                    theme.colors.mutedForeground
                                }
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Thuế VAT (%)</Text>
                            <TextInput
                                style={styles.input}
                                value={vatRate}
                                onChangeText={setVatRate}
                                placeholder="0"
                                placeholderTextColor={
                                    theme.colors.mutedForeground
                                }
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                </View>

                {/* Khác */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Thông tin khác</Text>

                    <Text style={styles.label}>Ảnh sản phẩm</Text>
                    <View style={styles.imageUploadBox}>
                        {localImageUri || imageUrl ? (
                            <Image
                                source={{ uri: localImageUri || imageUrl }}
                                style={styles.imagePreview}
                            />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Feather
                                    name="image"
                                    size={24}
                                    color={theme.colors.mutedForeground}
                                />
                                <Text style={styles.imagePlaceholderText}>
                                    Chưa có ảnh sản phẩm
                                </Text>
                            </View>
                        )}

                        <View style={styles.imageActionsRow}>
                            <TouchableOpacity
                                style={[
                                    styles.imageActionBtn,
                                    uploadingImage &&
                                        styles.imageActionBtnDisabled,
                                ]}
                                onPress={handlePickAndUploadImage}
                                disabled={uploadingImage || submitting}
                            >
                                {uploadingImage ? (
                                    <ActivityIndicator
                                        size="small"
                                        color={theme.colors.primary}
                                    />
                                ) : (
                                    <Feather
                                        name="upload"
                                        size={16}
                                        color={theme.colors.primary}
                                    />
                                )}
                                <Text style={styles.imageActionText}>
                                    {uploadingImage
                                        ? "Đang upload..."
                                        : "Chọn & upload ảnh"}
                                </Text>
                            </TouchableOpacity>

                            {(localImageUri || imageUrl) && (
                                <TouchableOpacity
                                    style={styles.imageRemoveBtn}
                                    onPress={handleClearImage}
                                    disabled={uploadingImage || submitting}
                                >
                                    <Feather
                                        name="trash-2"
                                        size={16}
                                        color={theme.colors.error}
                                    />
                                    <Text style={styles.imageRemoveText}>
                                        Xóa ảnh
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <Text style={styles.imageHint}>
                            Ảnh sẽ được upload vào Supabase Storage. URL được
                            lưu tự động khi bấm lưu sản phẩm.
                        </Text>
                    </View>

                    <View style={styles.switchRow}>
                        <Text style={styles.label}>Đang kinh doanh</Text>
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
                              ? "Cập nhật sản phẩm"
                              : "Tạo sản phẩm"}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Category Picker Modal */}
            <Modal
                visible={showCategoryModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowCategoryModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn danh mục</Text>
                            <TouchableOpacity
                                onPress={() => setShowCategoryModal(false)}
                            >
                                <Feather
                                    name="x"
                                    size={22}
                                    color={theme.colors.foreground}
                                />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.modalSearch}
                            placeholder="Tìm danh mục..."
                            placeholderTextColor={theme.colors.mutedForeground}
                            value={categorySearch}
                            onChangeText={setCategorySearch}
                        />
                        <FlatList
                            data={categories.filter((c) =>
                                c.name
                                    .toLowerCase()
                                    .includes(categorySearch.toLowerCase()),
                            )}
                            keyExtractor={(c) => String(c.id)}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.modalItem,
                                        item.id === categoryId &&
                                            styles.modalItemSelected,
                                    ]}
                                    onPress={() => {
                                        setCategoryId(item.id);
                                        setCategoryName(item.name);
                                        setShowCategoryModal(false);
                                        setCategorySearch("");
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.modalItemName,
                                            item.id === categoryId && {
                                                color: theme.colors.primary,
                                            },
                                        ]}
                                    >
                                        {item.name}
                                    </Text>
                                    {item.id === categoryId && (
                                        <Feather
                                            name="check"
                                            size={16}
                                            color={theme.colors.primary}
                                        />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
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
    pickerPlaceholder: { color: theme.colors.mutedForeground },
    switchRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 16,
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
        maxHeight: "75%",
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
    modalSearch: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        color: theme.colors.foreground,
        marginBottom: 10,
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
    modalItemName: {
        fontSize: 14,
        fontWeight: "600",
        color: theme.colors.foreground,
    },
    imageUploadBox: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        padding: 12,
        backgroundColor: theme.colors.background,
        gap: 10,
    },
    imagePreview: {
        width: "100%",
        height: 170,
        borderRadius: 8,
        resizeMode: "cover",
        backgroundColor: "#E2E8F0",
    },
    imagePlaceholder: {
        width: "100%",
        height: 170,
        borderRadius: 8,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: theme.colors.border,
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
    imagePlaceholderText: {
        fontSize: 13,
        color: theme.colors.mutedForeground,
        fontWeight: "600",
    },
    imageActionsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    imageActionBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    imageActionBtnDisabled: {
        opacity: 0.6,
    },
    imageActionText: {
        color: theme.colors.primary,
        fontSize: 13,
        fontWeight: "700",
    },
    imageRemoveBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderWidth: 1,
        borderColor: theme.colors.error,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    imageRemoveText: {
        color: theme.colors.error,
        fontSize: 13,
        fontWeight: "700",
    },
    imageHint: {
        fontSize: 12,
        color: theme.colors.mutedForeground,
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
});

export default ProductFormScreen;
