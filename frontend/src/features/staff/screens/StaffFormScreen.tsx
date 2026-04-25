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

const ROLES = [
    { value: "ADMIN", label: "Quản trị viên" },
    { value: "WAREHOUSE_STAFF", label: "Nhân viên kho" },
    { value: "SALES_STAFF", label: "Nhân viên bán hàng" },
];

const StaffFormScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const editId: number | undefined = route.params?.id;
    const isEdit = !!editId;

    const [staffCode, setStaffCode] = useState("");
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [taxCode, setTaxCode] = useState("");
    const [address, setAddress] = useState("");
    const [hireDate, setHireDate] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("WAREHOUSE_STAFF");
    const [isActive, setIsActive] = useState(true);
    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!isEdit) return;
        const load = async () => {
            try {
                const res = await axiosClient.get(`/staffs/${editId}`);
                setStaffCode(res.data.staffCode || "");
                setFullName(res.data.fullName || "");
                setPhone(res.data.phone || "");
                setEmail(res.data.email || "");
                setTaxCode(res.data.taxCode || "");
                setAddress(res.data.address || "");
                setHireDate(res.data.hireDate || "");
                setUsername(res.data.username || "");
                setRole(res.data.role || "WAREHOUSE_STAFF");
                setIsActive(res.data.isActive ?? true);
            } catch {
                Alert.alert("Lỗi", "Không thể tải dữ liệu nhân viên.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [editId]);

    const handleSubmit = async () => {
        if (!fullName.trim()) {
            Alert.alert("Thiếu thông tin", "Vui lòng nhập họ tên nhân viên.");
            return;
        }
        if (!username.trim()) {
            Alert.alert("Thiếu thông tin", "Vui lòng nhập tên đăng nhập.");
            return;
        }
        if (!role) {
            Alert.alert("Thiếu thông tin", "Vui lòng chọn chức vụ.");
            return;
        }

        const payload: any = {
            staffCode: null, // trigger SQL tự sinh NV-XXXXX
            fullName: fullName.trim(),
            phone: phone.trim() || null,
            email: email.trim() || null,
            taxCode: taxCode.trim() || null,
            address: address.trim() || null,
            hireDate: hireDate.trim() || null,
            username: username.trim(),
            role,
            isActive,
        };
        if (password.trim()) payload.password = password.trim();

        try {
            setSubmitting(true);
            if (isEdit) {
                await axiosClient.put(`/staffs/${editId}`, payload);
                Alert.alert("Thành công", "Đã cập nhật nhân viên.");
            } else {
                await axiosClient.post("/staffs", payload);
                Alert.alert("Thành công", "Đã tạo tài khoản nhân viên.");
            }
            navigation.goBack();
        } catch (err: any) {
            Alert.alert(
                "Lỗi",
                err?.response?.data?.message || "Không thể lưu nhân viên.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    const selectedRoleLabel =
        ROLES.find((r) => r.value === role)?.label || role;

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
                    {isEdit ? "Sửa nhân viên" : "Thêm nhân viên"}
                </Text>
            </View>

            <ScrollView
                style={styles.body}
                contentContainerStyle={{ paddingBottom: 120 }}
                keyboardShouldPersistTaps="handled"
            >
                {/* Thông tin cá nhân */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

                    <Text style={styles.label}>Mã nhân viên</Text>
                    <TextInput
                        style={[styles.input, styles.inputLocked]}
                        value={staffCode}
                        editable={false}
                        placeholder="Tự động sinh sau khi lưu"
                        placeholderTextColor={theme.colors.mutedForeground}
                    />

                    <View style={styles.rowInputs}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Ngày vào làm</Text>
                            <TextInput
                                style={styles.input}
                                value={hireDate}
                                onChangeText={setHireDate}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={
                                    theme.colors.mutedForeground
                                }
                            />
                        </View>
                    </View>

                    <Text style={styles.label}>
                        Họ tên đầy đủ <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Nguyễn Văn A"
                        placeholderTextColor={theme.colors.mutedForeground}
                    />

                    <View style={styles.rowInputs}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Số điện thoại</Text>
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="0901234567"
                                placeholderTextColor={
                                    theme.colors.mutedForeground
                                }
                                keyboardType="phone-pad"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Mã số thuế</Text>
                            <TextInput
                                style={styles.input}
                                value={taxCode}
                                onChangeText={setTaxCode}
                                placeholder="MSCN..."
                                placeholderTextColor={
                                    theme.colors.mutedForeground
                                }
                            />
                        </View>
                    </View>

                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="email@company.com"
                        placeholderTextColor={theme.colors.mutedForeground}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>Địa chỉ</Text>
                    <TextInput
                        style={[styles.input, styles.inputMultiline]}
                        value={address}
                        onChangeText={setAddress}
                        placeholder="Địa chỉ thường trú..."
                        placeholderTextColor={theme.colors.mutedForeground}
                        multiline
                        numberOfLines={2}
                    />
                </View>

                {/* Tài khoản & Quyền hạn */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        Tài khoản & Quyền hạn
                    </Text>

                    <Text style={styles.label}>
                        Tên đăng nhập <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={[styles.input, isEdit && styles.inputLocked]}
                        value={username}
                        onChangeText={setUsername}
                        placeholder="username"
                        placeholderTextColor={theme.colors.mutedForeground}
                        autoCapitalize="none"
                        editable={!isEdit}
                    />

                    <Text style={styles.label}>
                        {isEdit
                            ? "Mật khẩu mới (để trống nếu không đổi)"
                            : "Mật khẩu"}
                    </Text>
                    <View style={styles.passwordRow}>
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            value={password}
                            onChangeText={setPassword}
                            placeholder={
                                isEdit
                                    ? "Nhập mật khẩu mới..."
                                    : "Mặc định: 123456"
                            }
                            placeholderTextColor={theme.colors.mutedForeground}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity
                            style={styles.eyeBtn}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Feather
                                name={showPassword ? "eye-off" : "eye"}
                                size={18}
                                color={theme.colors.mutedForeground}
                            />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>
                        Chức vụ / Vai trò <Text style={styles.required}>*</Text>
                    </Text>
                    <TouchableOpacity
                        style={styles.picker}
                        onPress={() => setShowRoleModal(true)}
                    >
                        <Feather
                            name="shield"
                            size={16}
                            color={theme.colors.mutedForeground}
                        />
                        <Text style={styles.pickerText}>
                            {selectedRoleLabel}
                        </Text>
                        <Feather
                            name="chevron-down"
                            size={16}
                            color={theme.colors.mutedForeground}
                        />
                    </TouchableOpacity>

                    <View style={styles.switchRow}>
                        <Text style={styles.label}>
                            Tài khoản đang hoạt động
                        </Text>
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
                              : "Tạo nhân viên"}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Role picker modal */}
            <Modal
                visible={showRoleModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowRoleModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn chức vụ</Text>
                            <TouchableOpacity
                                onPress={() => setShowRoleModal(false)}
                            >
                                <Feather
                                    name="x"
                                    size={22}
                                    color={theme.colors.foreground}
                                />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={ROLES}
                            keyExtractor={(r) => r.value}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.modalItem,
                                        item.value === role &&
                                            styles.modalItemSelected,
                                    ]}
                                    onPress={() => {
                                        setRole(item.value);
                                        setShowRoleModal(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.modalItemName,
                                            item.value === role && {
                                                color: theme.colors.primary,
                                            },
                                        ]}
                                    >
                                        {item.label}
                                    </Text>
                                    {item.value === role && (
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
    inputMultiline: { height: 60, textAlignVertical: "top" },
    inputLocked: {
        backgroundColor: theme.colors.muted,
        color: theme.colors.mutedForeground,
    },
    rowInputs: { flexDirection: "row", gap: 12 },
    passwordRow: { flexDirection: "row", gap: 8, alignItems: "center" },
    eyeBtn: { padding: 10 },
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
        maxHeight: "60%",
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

export default StaffFormScreen;
