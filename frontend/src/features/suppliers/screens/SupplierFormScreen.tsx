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
import {
  getProductsBySupplier,
  createSupplierProduct,
  deleteSupplierProduct,
  updateSupplierProduct,
  SupplierProductDTO,
} from "../../../api/supplierProductApi";
import { useAuthStore } from "../../../store/authStore";
import { Role } from "../../../types";
import { theme } from "../../../utils/theme";
import { showAlert } from "../../../utils/alerts";

const SupplierFormScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const userRole = useAuthStore((state) => state.role);
  const editId: string | undefined = route.params?.id; // UUID string
  const isEdit = !!editId;
  const isAdmin = userRole === Role.ADMIN;

  // supplierCode là readonly — trigger SQL tự sinh NCC-XXXXX khi create
  const [supplierCode, setSupplierCode] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [address, setAddress] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  // Supplier products (bảng giá NCC)
  const [supplierProducts, setSupplierProducts] = useState<
    SupplierProductDTO[]
  >([]);
  const [loadingSP, setLoadingSP] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [addProductSearch, setAddProductSearch] = useState("");
  const [addingPrice, setAddingPrice] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [addingProduct, setAddingProduct] = useState(false);
  const [editingSpId, setEditingSpId] = useState<number | null>(null);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState("");
  const [editingProductName, setEditingProductName] = useState("");
  const [deletingProductId, setDeletingProductId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const res = await axiosClient.get(`/suppliers/${editId}`);
        setSupplierCode(res.data.supplierCode || "");
        setName(res.data.name || "");
        setPhone(res.data.phone || "");
        setTaxCode(res.data.taxCode || "");
        setAddress(res.data.address || "");
        setIsActive(res.data.isActive ?? true);
      } catch {
        showAlert("Lỗi", "Không thể tải dữ liệu nhà cung cấp.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [editId]);

  // Load supplier products khi edit
  useEffect(() => {
    if (!isEdit || !editId) return;
    loadSupplierProducts();
  }, [editId]);

  // Load all products cho modal thêm SP
  useEffect(() => {
    const loadAll = async () => {
      try {
        const res = await axiosClient.get("/products?size=500&isActive=true");
        setAllProducts(res.data.content || res.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    loadAll();
  }, []);

  const loadSupplierProducts = async () => {
    if (!editId) return;
    setLoadingSP(true);
    try {
      const res = await getProductsBySupplier(editId);
      setSupplierProducts(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSP(false);
    }
  };

  const handleAddProduct = async () => {
    if (!selectedProductId || !addingPrice || Number(addingPrice) < 0) {
      showAlert("Thiếu thông tin", "Vui lòng chọn sản phẩm và nhập giá.");
      return;
    }
    try {
      setAddingProduct(true);
      await createSupplierProduct({
        supplierId: editId!,
        productId: selectedProductId,
        standardPrice: Number(addingPrice),
      });
      setShowAddProductModal(false);
      setSelectedProductId(null);
      setAddingPrice("");
      setAddProductSearch("");
      await loadSupplierProducts();
    } catch (err: any) {
      showAlert(
        "Lỗi",
        err?.response?.data?.message || "Không thể thêm sản phẩm.",
      );
    } finally {
      setAddingProduct(false);
    }
  };

  const openEditProductModal = (sp: SupplierProductDTO) => {
    setEditingSpId(sp.id);
    setSelectedProductId(sp.productId);
    setEditingProductName(sp.productName);
    setEditingPrice(String(sp.standardPrice));
    setShowEditProductModal(true);
  };

  const handleSaveEditProduct = async () => {
    if (
      !editingSpId ||
      !selectedProductId ||
      !editingPrice ||
      Number(editingPrice) < 0
    ) {
      showAlert("Thiếu thông tin", "Vui lòng nhập giá hợp lệ.");
      return;
    }
    try {
      setAddingProduct(true);
      await updateSupplierProduct(editingSpId, {
        supplierId: editId!,
        productId: selectedProductId,
        standardPrice: Number(editingPrice),
      });
      setShowEditProductModal(false);
      setEditingSpId(null);
      setSelectedProductId(null);
      setEditingPrice("");
      setEditingProductName("");
      await loadSupplierProducts();
    } catch (err: any) {
      showAlert(
        "Lỗi",
        err?.response?.data?.message || "Không thể cập nhật giá.",
      );
    } finally {
      setAddingProduct(false);
    }
  };

  const handleRemoveProduct = (sp: SupplierProductDTO) => {
    showAlert("Xóa sản phẩm", `Xóa "${sp.productName}" khỏi bảng giá NCC?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            setDeletingProductId(sp.id);
            await deleteSupplierProduct(sp.id);
            await loadSupplierProducts();
          } catch (err: any) {
            console.error("Delete supplier product failed:", err);
            showAlert(
              "Lỗi",
              err?.response?.data?.message ||
                `Không thể xóa. HTTP ${err?.response?.status || "?"}`,
            );
          } finally {
            setDeletingProductId(null);
          }
        },
      },
    ]);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      showAlert("Thiếu thông tin", "Vui lòng nhập tên nhà cung cấp.");
      return;
    }
    const payload = {
      name: name.trim(),
      phone: phone.trim() || null,
      taxCode: taxCode.trim() || null,
      address: address.trim() || null,
      isActive,
    };
    if (!isEdit) {
      (payload as any).supplierCode = null; // trigger SQL tự sinh NCC-XXXXX khi tạo mới
    }
    try {
      setSubmitting(true);
      if (isEdit) {
        await axiosClient.put(`/suppliers/${editId}`, payload);
        showAlert("Thành công", "Đã cập nhật nhà cung cấp.");
      } else {
        await axiosClient.post("/suppliers", payload);
        showAlert("Thành công", "Đã tạo nhà cung cấp mới.");
      }
      navigation.goBack();
    } catch (err: any) {
      showAlert(
        "Lỗi",
        err?.response?.data?.message || "Không thể lưu nhà cung cấp.",
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
          {isEdit ? "Sửa nhà cung cấp" : "Thêm nhà cung cấp"}
        </Text>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin nhà cung cấp</Text>

          {/* Mã NCC — luôn hiển thị, luôn khóa */}
          <Text style={styles.label}>Mã nhà cung cấp</Text>
          <TextInput
            style={[styles.input, styles.inputLocked]}
            value={supplierCode}
            editable={false}
            placeholder="Tự động sinh sau khi lưu"
            placeholderTextColor={theme.colors.mutedForeground}
          />

          <Text style={styles.label}>
            Tên nhà cung cấp <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Công ty TNHH ABC"
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
                placeholderTextColor={theme.colors.mutedForeground}
                keyboardType="phone-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Mã số thuế</Text>
              <TextInput
                style={styles.input}
                value={taxCode}
                onChangeText={setTaxCode}
                placeholder="0123456789"
                placeholderTextColor={theme.colors.mutedForeground}
              />
            </View>
          </View>

          <Text style={styles.label}>Địa chỉ</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={address}
            onChangeText={setAddress}
            placeholder="Địa chỉ công ty..."
            placeholderTextColor={theme.colors.mutedForeground}
            multiline
            numberOfLines={3}
          />

          <View style={styles.switchRow}>
            <Text style={styles.label}>Đang hợp tác</Text>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setIsActive((prev) => !prev)}
              accessibilityRole="switch"
              accessibilityState={{ checked: isActive }}
              style={[styles.toggleTrack, isActive && styles.toggleTrackOn]}
            >
              <View
                style={[styles.toggleThumb, isActive && styles.toggleThumbOn]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bảng giá sản phẩm NCC (chỉ hiển khi edit và ADMIN) */}
        {isEdit && isAdmin && (
          <View style={styles.card}>
            <View style={styles.spHeader}>
              <Text style={styles.sectionTitle}>Sản phẩm cung cấp</Text>
              <TouchableOpacity
                style={styles.spAddBtn}
                onPress={() => setShowAddProductModal(true)}
              >
                <Feather name="plus" size={14} color="#fff" />
                <Text style={styles.spAddBtnText}>Thêm SP</Text>
              </TouchableOpacity>
            </View>

            {loadingSP ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
                style={{ padding: 20 }}
              />
            ) : supplierProducts.length === 0 ? (
              <View style={styles.spEmpty}>
                <Feather name="inbox" size={28} color={theme.colors.muted} />
                <Text style={styles.spEmptyText}>
                  Chưa có sản phẩm nào. Nhấn "Thêm SP" để bổ sung.
                </Text>
              </View>
            ) : (
              supplierProducts.map((sp) => (
                <View key={sp.id} style={styles.spRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.spName}>{sp.productName}</Text>
                    <Text style={styles.spSku}>SKU: {sp.productSku}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.spPrice}>
                      {Number(sp.standardPrice).toLocaleString("vi-VN")} đ
                    </Text>
                    {sp.lastUpdatedAt && (
                      <Text style={styles.spDate}>
                        C/nh:{" "}
                        {new Date(sp.lastUpdatedAt).toLocaleDateString("vi-VN")}
                      </Text>
                    )}
                  </View>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                      style={styles.spRemoveBtn}
                      onPress={() => openEditProductModal(sp)}
                    >
                      <Feather
                        name="edit-2"
                        size={16}
                        color={theme.colors.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.spRemoveBtn}
                      onPress={() => handleRemoveProduct(sp)}
                      disabled={deletingProductId === sp.id}
                    >
                      {deletingProductId === sp.id ? (
                        <ActivityIndicator size="small" color={theme.colors.error} />
                      ) : (
                        <Feather
                          name="trash-2"
                          size={16}
                          color={theme.colors.error}
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
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
                : "Tạo nhà cung cấp"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal thêm SP vào bảng giá NCC */}
      <Modal
        visible={showAddProductModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddProductModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm sản phẩm vào bảng giá</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddProductModal(false);
                  setSelectedProductId(null);
                  setAddingPrice("");
                }}
              >
                <Feather name="x" size={22} color={theme.colors.foreground} />
              </TouchableOpacity>
            </View>

            {!selectedProductId ? (
              <>
                <TextInput
                  style={styles.modalSearch}
                  placeholder="Tìm sản phẩm theo tên, SKU..."
                  placeholderTextColor={theme.colors.mutedForeground}
                  value={addProductSearch}
                  onChangeText={setAddProductSearch}
                />
                <FlatList
                  data={allProducts.filter((p: any) => {
                    const inSearch =
                      p.name
                        .toLowerCase()
                        .includes(addProductSearch.toLowerCase()) ||
                      p.sku
                        .toLowerCase()
                        .includes(addProductSearch.toLowerCase());
                    const alreadyAdded = supplierProducts.some(
                      (sp) => sp.productId === p.id,
                    );
                    return inSearch && !alreadyAdded;
                  })}
                  keyExtractor={(p: any) => String(p.id)}
                  renderItem={({ item }: any) => (
                    <TouchableOpacity
                      style={styles.modalItem}
                      onPress={() => {
                        setSelectedProductId(item.id);
                        setAddingPrice(
                          String(item.lastPurchaseCost ?? item.avgCost ?? 0),
                        );
                      }}
                    >
                      <Text style={styles.modalItemName}>{item.name}</Text>
                      <Text style={styles.modalItemSub}>SKU: {item.sku}</Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Text
                      style={{
                        textAlign: "center",
                        padding: 20,
                        color: theme.colors.mutedForeground,
                      }}
                    >
                      Không tìm thấy sản phẩm phù hợp.
                    </Text>
                  }
                />
              </>
            ) : (
              <View style={{ padding: 4 }}>
                <Text style={styles.label}>Sản phẩm đã chọn:</Text>
                <Text style={[styles.spName, { marginBottom: 12 }]}>
                  {allProducts.find((p) => p.id === selectedProductId)?.name ??
                    ""}
                </Text>

                <Text style={styles.label}>
                  Giá mua mặc định (VND) <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={addingPrice}
                  onChangeText={setAddingPrice}
                  placeholder="Nhập giá..."
                  placeholderTextColor={theme.colors.mutedForeground}
                />

                <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      { flex: 1, backgroundColor: theme.colors.muted },
                    ]}
                    onPress={() => {
                      setSelectedProductId(null);
                      setAddingPrice("");
                    }}
                  >
                    <Text
                      style={[
                        styles.submitBtnText,
                        { color: theme.colors.foreground },
                      ]}
                    >
                      Quay lại
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      { flex: 1 },
                      addingProduct && styles.submitBtnDisabled,
                    ]}
                    onPress={handleAddProduct}
                    disabled={addingProduct}
                  >
                    {addingProduct ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Feather name="check" size={16} color="#fff" />
                    )}
                    <Text style={styles.submitBtnText}>
                      {addingProduct ? "Đang lưu..." : "Xác nhận"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal sửa giá SP */}
      <Modal
        visible={showEditProductModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditProductModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cập nhật giá sản phẩm</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowEditProductModal(false);
                  setEditingSpId(null);
                  setSelectedProductId(null);
                  setEditingPrice("");
                  setEditingProductName("");
                }}
              >
                <Feather name="x" size={22} color={theme.colors.foreground} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 4 }}>
              <Text style={styles.label}>Sản phẩm đang chọn:</Text>
              <Text style={[styles.spName, { marginBottom: 12 }]}>
                {editingProductName}
              </Text>

              <Text style={styles.label}>
                Giá mua mới (VND) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={editingPrice}
                onChangeText={setEditingPrice}
                placeholder="Nhập giá mới..."
                placeholderTextColor={theme.colors.mutedForeground}
              />

              <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    { flex: 1, backgroundColor: theme.colors.muted },
                  ]}
                  onPress={() => {
                    setShowEditProductModal(false);
                    setEditingSpId(null);
                    setSelectedProductId(null);
                    setEditingPrice("");
                    setEditingProductName("");
                  }}
                >
                  <Text
                    style={[
                      styles.submitBtnText,
                      { color: theme.colors.foreground },
                    ]}
                  >
                    Hủy
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    { flex: 1 },
                    addingProduct && styles.submitBtnDisabled,
                  ]}
                  onPress={handleSaveEditProduct}
                  disabled={addingProduct}
                >
                  {addingProduct ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Feather name="check" size={16} color="#fff" />
                  )}
                  <Text style={styles.submitBtnText}>
                    {addingProduct ? "Đang lưu..." : "Cập nhật"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
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
  inputLocked: {
    backgroundColor: theme.colors.muted,
    color: theme.colors.mutedForeground,
  },
  inputMultiline: { height: 80, textAlignVertical: "top" },
  rowInputs: { flexDirection: "row", gap: 12 },
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

  // Supplier Products section
  spHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  spAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  spAddBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  spEmpty: { alignItems: "center", paddingVertical: 24, gap: 8 },
  spEmptyText: {
    color: theme.colors.mutedForeground,
    fontSize: 13,
    textAlign: "center",
  },
  spRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  spName: { fontSize: 14, fontWeight: "600", color: theme.colors.foreground },
  spSku: { fontSize: 12, color: theme.colors.mutedForeground, marginTop: 2 },
  spPrice: { fontSize: 14, fontWeight: "700", color: theme.colors.primary },
  spDate: { fontSize: 11, color: theme.colors.mutedForeground, marginTop: 2 },
  spRemoveBtn: { padding: 6 },

  // Modal styles
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
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.foreground,
  },
  modalItemSub: {
    fontSize: 12,
    color: theme.colors.mutedForeground,
    marginTop: 2,
  },
});

export default SupplierFormScreen;
