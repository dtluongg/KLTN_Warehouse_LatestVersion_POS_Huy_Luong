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
import { showAlert } from "../../../utils/alerts";

interface Warehouse {
  id: number;
  name: string;
  code?: string;
}
interface PurchaseOrder {
  id: number;
  poNo: string;
  supplierId: string;
  supplierName: string;
  warehouseId: number;
  warehouseName: string;
  receiptProgress?: string;
  closedAt?: string | null;
}
interface POItem {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  orderedQty: number;
  receivedQty?: number;
  remainingQty?: number;
  expectedUnitCost: number;
  vatRate?: number;
}

interface GrStats {
  postedByPoItemId: Map<number, number>;
  pendingByPoItemId: Map<number, number>;
}

interface LineItem {
  poItemId: number;
  productId: number;
  productName: string;
  productSku: string;
  receivedQty: number;
  unitCost: number;
  vatRate: number;
  maxQty?: number;
  orderedQty?: number;
  receivedQtyPosted?: number;
  pendingQty?: number;
}

const GoodsReceiptFormScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editId: number | undefined = route.params?.id;
  const isEdit = !!editId;

  const [poId, setPoId] = useState<number | null>(null);
  const [poNo, setPoNo] = useState<string>("");
  const [allowOverReceipt, setAllowOverReceipt] = useState<boolean>(false);
  const [supplierId, setSupplierId] = useState<string>("");
  const [supplierName, setSupplierName] = useState<string>("");
  const [warehouseId, setWarehouseId] = useState<number | null>(null);
  const [warehouseName, setWarehouseName] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [discountAmount, setDiscountAmount] = useState<string>("0");
  const [surchargeAmount, setSurchargeAmount] = useState<string>("0");
  const [items, setItems] = useState<LineItem[]>([]);
  const [status, setStatus] = useState<string>("DRAFT");

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [showPoModal, setShowPoModal] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [poSearch, setPoSearch] = useState("");

  const grossAmount = items.reduce((s, i) => s + i.receivedQty * i.unitCost, 0);
  const vatAmount = items.reduce(
    (s, i) => s + i.receivedQty * i.unitCost * (i.vatRate / 100),
    0,
  );
  const netAmount =
    grossAmount +
    vatAmount -
    Number(discountAmount || 0) +
    Number(surchargeAmount || 0);
  const canEdit = !isEdit || status === "DRAFT";

  useEffect(() => {
    const load = async () => {
      try {
        const [poRes, wRes] = await Promise.all([
          axiosClient.get(
            "/purchase-orders?status=POSTED&isClosed=false&size=200",
          ),
          axiosClient.get("/warehouses?size=100"),
        ]);
        const poRows = poRes.data.content || poRes.data || [];
        setPurchaseOrders(poRows);
        setWarehouses(wRes.data.content || wRes.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const handleSelectPO = async (po: PurchaseOrder) => {
    setPoId(po.id);
    setPoNo(po.poNo);
    setShowPoModal(false);
    setPoSearch("");
    try {
      const res = await axiosClient.get(`/purchase-orders/${po.id}`);
      const poDetail = res.data;
      setSupplierId(poDetail.supplierId || "");
      setSupplierName(poDetail.supplierName || po.supplierName || "");
      setAllowOverReceipt(Boolean(poDetail.allowOverReceipt));

      setWarehouseId(poDetail.warehouseId || po.warehouseId || null);
      setWarehouseName(poDetail.warehouseName || po.warehouseName || "");
      const poItems: POItem[] = (poDetail.items || []).filter(
        (item: POItem) => Number(item.remainingQty || 0) > 0,
      );
      if (poItems.length === 0) {
        showAlert("Không còn dòng nhận", "PO này đã nhận đủ hoặc đã đóng.");
        setItems([]);
        return;
      }
      setDiscountAmount(String(poDetail.discountAmount ?? 0));
      setSurchargeAmount(String(poDetail.surchargeAmount ?? 0));
      setItems(
        poItems.map((item: any) => {
          const orderedQty = item.orderedQty || 0;
          const receivedQtyPosted = item.receivedQty || 0;
          const pendingQty = item.pendingQty || 0;
          const maxQty = Math.max(
            0,
            orderedQty - receivedQtyPosted - pendingQty,
          );
          return {
            orderedQty,
            receivedQtyPosted,
            pendingQty,
            poItemId: item.id,
            productId: item.productId,
            productName: item.productName || "",
            productSku: item.productSku || "",
            receivedQty: Number(item.remainingQty ?? 0),
            unitCost: item.expectedUnitCost,
            vatRate: Number(item.vatRate ?? 0),
            maxQty,
          };
        }),
      );
    } catch (e) {
      console.error("Load PO items:", e);
    }
  };

  useEffect(() => {
    if (!isEdit) return;
    const loadEdit = async () => {
      try {
        const res = await axiosClient.get(`/goods-receipts/${editId}`);
        const d = res.data;
        setPoId(d.poId);
        setPoNo(d.poNo || "");
        setSupplierId(d.supplierId);
        setSupplierName(d.supplierName || "");
        setWarehouseId(d.warehouseId);
        setWarehouseName(d.warehouseName || "");
        setNote(d.note || "");
        setDiscountAmount(String(d.discountAmount ?? 0));
        setSurchargeAmount(String(d.surchargeAmount ?? 0));
        setStatus(d.status || "DRAFT");
        setAllowOverReceipt(
          Boolean(
            d.poId
              ? (await axiosClient.get(`/purchase-orders/${d.poId}`)).data
                  ?.allowOverReceipt
              : false,
          ),
        );

        // Lấy chi tiết PO để có orderedQty
        const poDetailRes = d.poId
          ? await axiosClient.get(`/purchase-orders/${d.poId}`)
          : null;
        const poItemsMap = new Map();
        const poPendingMap = new Map();
        const poPostedMap = new Map();
        if (poDetailRes) {
          poDetailRes.data?.items?.forEach((it: any) => {
            poItemsMap.set(it.id, it.orderedQty || 0);
            poPostedMap.set(it.id, it.receivedQty || 0);
            poPendingMap.set(it.id, it.pendingQty || 0);
          });
        }
        const rawItems = d.items || [];
        setItems(
          rawItems.map((item: any) => {
            const orderedQty = poItemsMap.get(item.poItemId) || 0;
            const receivedQtyPosted = poPostedMap.get(item.poItemId) || 0;
            // Subtract the qty of THIS draft GR from pendingQty so we don't double count it
            let pendingQty = poPendingMap.get(item.poItemId) || 0;
            if (d.status === "DRAFT") {
              pendingQty -= item.receivedQty || 0;
            }
            pendingQty = Math.max(0, pendingQty);
            const maxQty = Math.max(
              0,
              orderedQty - receivedQtyPosted - pendingQty,
            );
            return {
              orderedQty,
              receivedQtyPosted,
              pendingQty,
              maxQty,
              poItemId: item.poItemId,
              productId: item.productId,
              productName: item.productName || "",
              productSku: item.productSku || "",
              receivedQty: item.receivedQty,
              unitCost: item.unitCost,
              vatRate: Number(item.vatRate ?? 0),
            };
          }),
        );
      } catch (e) {
        showAlert("Lỗi", "Không thể tải phiếu.");
      } finally {
        setLoading(false);
      }
    };
    loadEdit();
  }, [editId]);

  const updateItem = (idx: number, field: keyof LineItem, val: any) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, [field]: val } : it)),
    );
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!poId) {
      showAlert("Thiếu thông tin", "Chọn phiếu đặt hàng (PO).");
      return;
    }
    if (!warehouseId) {
      showAlert("Thiếu thông tin", "Chọn kho nhận hàng.");
      return;
    }
    if (items.length === 0) {
      showAlert("Thiếu sản phẩm", "Phiếu phải có ít nhất 1 sản phẩm.");
      return;
    }
    const invalidItem = items.find(
      (it) =>
        it.receivedQty <= 0 ||
        (!allowOverReceipt && it.maxQty != null && it.receivedQty > it.maxQty),
    );
    if (invalidItem) {
      showAlert(
        "Số lượng không hợp lệ",
        "Có dòng nhận vượt quá số lượng còn lại hoặc nhỏ hơn 1.",
      );
      return;
    }
    const payload = {
      poId,
      supplierId,
      warehouseId,
      note: note || null,
      discountAmount: Number(discountAmount) || 0,
      surchargeAmount: Number(surchargeAmount) || 0,
      items: items.map((it) => ({
        poItemId: it.poItemId,
        productId: it.productId,
        receivedQty: it.receivedQty,
        unitCost: it.unitCost,
      })),
    };
    try {
      setSubmitting(true);
      if (isEdit) {
        await axiosClient.put(`/goods-receipts/${editId}`, payload);
        showAlert("Thành công", "Đã cập nhật phiếu.");
      } else {
        const res = await axiosClient.post("/goods-receipts", payload);
        showAlert("Thành công", `Đã tạo phiếu ${res.data.grNo}.`);
      }
      navigation.goBack();
    } catch (err: any) {
      showAlert("Lỗi", err?.response?.data?.message || "Không thể lưu phiếu.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );

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
          {isEdit ? "Sửa phiếu nhập hàng" : "Tạo phiếu nhập hàng (GR)"}
        </Text>
      </View>

      {!canEdit && (
        <View style={styles.lockedBanner}>
          <Feather name="lock" size={14} color="#92400e" />
          <Text style={styles.lockedText}>
            Phiếu đã duyệt ({status}). Không thể chỉnh sửa.
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.body}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin chung</Text>

          <Text style={styles.label}>
            Phiếu đặt hàng (PO) <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[
              styles.picker,
              (!canEdit || isEdit) && styles.pickerDisabled,
            ]}
            onPress={() => canEdit && !isEdit && setShowPoModal(true)}
            disabled={!canEdit || isEdit}
          >
            <Feather
              name="file-text"
              size={16}
              color={theme.colors.mutedForeground}
            />
            <Text
              style={[
                styles.pickerText,
                poId ? styles.pickerValue : styles.pickerPlaceholder,
              ]}
            >
              {poId ? `${poNo} · ${supplierName}` : "Chọn phiếu đặt hàng..."}
            </Text>
            {canEdit && !isEdit && (
              <Feather
                name="chevron-down"
                size={16}
                color={theme.colors.mutedForeground}
              />
            )}
          </TouchableOpacity>

          <Text style={styles.label}>
            Kho nhận hàng <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.picker, !canEdit && styles.pickerDisabled]}
            onPress={() => canEdit && setShowWarehouseModal(true)}
            disabled={!canEdit}
          >
            <Feather
              name="archive"
              size={16}
              color={theme.colors.mutedForeground}
            />
            <Text
              style={[
                styles.pickerText,
                warehouseId ? styles.pickerValue : styles.pickerPlaceholder,
              ]}
            >
              {warehouseName || "Chọn kho nhận hàng..."}
            </Text>
            {canEdit && (
              <Feather
                name="chevron-down"
                size={16}
                color={theme.colors.mutedForeground}
              />
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Ghi chú</Text>
          <TextInput
            style={[
              styles.input,
              styles.inputMultiline,
              !canEdit && styles.inputDisabled,
            ]}
            value={note}
            onChangeText={setNote}
            placeholder="Ghi chú..."
            multiline
            numberOfLines={3}
            editable={canEdit}
            placeholderTextColor={theme.colors.mutedForeground}
          />
        </View>

        {items.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Danh sách sản phẩm nhập</Text>
            {items.map((item, idx) => {
              const lineGross = item.receivedQty * item.unitCost;
              const lineVat = (lineGross * item.vatRate) / 100;
              return (
                <View key={item.poItemId} style={styles.lineItem}>
                  <View style={styles.lineItemHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lineItemName}>
                        {item.productName}
                      </Text>
                      <Text style={styles.lineItemSku}>
                        SKU: {item.productSku}
                      </Text>
                      <Text style={styles.lineItemReceived}>
                        Đã đặt: {item.orderedQty ?? 0}
                        {item.pendingQty != null
                          ? `  |  Chờ duyệt: ${item.pendingQty}`
                          : ""}
                        {item.receivedQtyPosted != null
                          ? `  |  Đã nhập: ${item.receivedQtyPosted}`
                          : ""}
                        {item.maxQty != null
                          ? `  |  Cần nhập thêm: ${item.maxQty}`
                          : ""}
                      </Text>
                    </View>
                    {allowOverReceipt && (
                      <View
                        style={[
                          styles.vatBadge,
                          { backgroundColor: "#dcfce7", marginRight: 8 },
                        ]}
                      >
                        <Text
                          style={[styles.vatBadgeText, { color: "#166534" }]}
                        >
                          Cho phép nhập vượt
                        </Text>
                      </View>
                    )}
                    {item.vatRate > 0 && (
                      <View style={styles.vatBadge}>
                        <Text style={styles.vatBadgeText}>
                          VAT {item.vatRate}%
                        </Text>
                      </View>
                    )}
                    {canEdit && (
                      <TouchableOpacity
                        onPress={() => removeItem(idx)}
                        style={styles.removeBtn}
                      >
                        <Feather
                          name="x"
                          size={18}
                          color={theme.colors.error}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.lineItemInputRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lineInputLabel}>
                        Số lượng
                        {item.maxQty != null
                          ? allowOverReceipt
                            ? ` (Gợi ý: ${item.maxQty})`
                            : ` (Tối đa: ${item.maxQty})`
                          : ""}
                      </Text>
                      <TextInput
                        style={[
                          styles.lineInput,
                          !canEdit && styles.inputDisabled,
                        ]}
                        keyboardType="numeric"
                        value={String(item.receivedQty)}
                        onChangeText={(v) =>
                          updateItem(idx, "receivedQty", Number(v) || 0)
                        }
                        editable={canEdit}
                      />
                    </View>
                    <View style={{ flex: 1.5 }}>
                      <Text style={styles.lineInputLabel}>Giá nhập (VND)</Text>
                      <TextInput
                        style={[
                          styles.lineInput,
                          !canEdit && styles.inputDisabled,
                        ]}
                        keyboardType="numeric"
                        value={String(item.unitCost)}
                        onChangeText={(v) =>
                          updateItem(idx, "unitCost", Number(v) || 0)
                        }
                        editable={canEdit}
                      />
                    </View>
                    <View
                      style={{
                        flex: 1.5,
                        alignItems: "flex-end",
                        justifyContent: "flex-end",
                      }}
                    >
                      <Text style={styles.lineInputLabel}>
                        Thành tiền
                        {item.vatRate > 0 ? ` (+${item.vatRate}%VAT)` : ""}
                      </Text>
                      <Text style={styles.lineSubtotal}>
                        {(lineGross + lineVat).toLocaleString("vi-VN")} đ
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Điều chỉnh giá</Text>
          <View style={styles.rowInputs}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Chiết khấu (VND)</Text>
              <TextInput
                style={[styles.input, !canEdit && styles.inputDisabled]}
                keyboardType="numeric"
                value={discountAmount}
                onChangeText={setDiscountAmount}
                editable={canEdit}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Phụ phí (VND)</Text>
              <TextInput
                style={[styles.input, !canEdit && styles.inputDisabled]}
                keyboardType="numeric"
                value={surchargeAmount}
                onChangeText={setSurchargeAmount}
                editable={canEdit}
              />
            </View>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tiền hàng:</Text>
            <Text style={styles.summaryValue}>
              {grossAmount.toLocaleString("vi-VN")} đ
            </Text>
          </View>
          {vatAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Thuế VAT:</Text>
              <Text style={[styles.summaryValue, { color: "#f59e0b" }]}>
                + {vatAmount.toLocaleString("vi-VN")} đ
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Chiết khấu:</Text>
            <Text style={styles.summaryValue}>
              - {Number(discountAmount || 0).toLocaleString("vi-VN")} đ
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phụ phí:</Text>
            <Text style={styles.summaryValue}>
              + {Number(surchargeAmount || 0).toLocaleString("vi-VN")} đ
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Tổng cộng:</Text>
            <Text style={styles.summaryTotalValue}>
              {netAmount.toLocaleString("vi-VN")} đ
            </Text>
          </View>
        </View>
      </ScrollView>

      {canEdit && (
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
                  ? "Cập nhật phiếu"
                  : "Tạo phiếu nhập hàng"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={showPoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn phiếu đặt hàng</Text>
              <TouchableOpacity onPress={() => setShowPoModal(false)}>
                <Feather name="x" size={22} color={theme.colors.foreground} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalSearch}
              placeholder="Tìm mã PO, nhà cung cấp..."
              value={poSearch}
              onChangeText={setPoSearch}
              placeholderTextColor={theme.colors.mutedForeground}
            />
            <FlatList
              data={purchaseOrders.filter(
                (p) =>
                  p.poNo.toLowerCase().includes(poSearch.toLowerCase()) ||
                  p.supplierName.toLowerCase().includes(poSearch.toLowerCase()),
              )}
              keyExtractor={(p) => String(p.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSelectPO(item)}
                >
                  <Text style={styles.modalItemName}>{item.poNo}</Text>
                  <Text style={styles.modalItemSub}>
                    {item.supplierName} · Kho: {item.warehouseName}
                  </Text>
                  <Text style={styles.modalItemSub}>
                    Tiến độ: {item.receiptProgress || "NOT_RECEIVED"}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showWarehouseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWarehouseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn kho hàng</Text>
              <TouchableOpacity onPress={() => setShowWarehouseModal(false)}>
                <Feather name="x" size={22} color={theme.colors.foreground} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={warehouses}
              keyExtractor={(w) => String(w.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setWarehouseId(item.id);
                    setWarehouseName(item.name);
                    setShowWarehouseModal(false);
                  }}
                >
                  <Text style={styles.modalItemName}>{item.name}</Text>
                  {item.code && (
                    <Text style={styles.modalItemSub}>Mã: {item.code}</Text>
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
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  lockedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  lockedText: { flex: 1, color: "#92400e", fontSize: 13 },
  lineItemReceived: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 4,
    fontWeight: "600",
    lineHeight: 18,
  },
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
  inputMultiline: { height: 80, textAlignVertical: "top" },
  inputDisabled: {
    backgroundColor: theme.colors.muted,
    color: theme.colors.mutedForeground,
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
  pickerDisabled: { backgroundColor: theme.colors.muted },
  pickerText: { flex: 1, fontSize: 14, color: theme.colors.foreground },
  pickerValue: { color: "#111827", fontWeight: "500" },
  pickerPlaceholder: { color: theme.colors.mutedForeground },
  rowInputs: { flexDirection: "row", gap: 12 },
  lineItem: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: theme.colors.background,
  },
  lineItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  lineItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.foreground,
    flex: 1,
  },
  lineItemSku: {
    fontSize: 12,
    color: theme.colors.mutedForeground,
    marginBottom: 10,
  },
  vatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#fef9c3",
  },
  vatBadgeText: { fontSize: 11, fontWeight: "700", color: "#92400e" },
  removeBtn: { padding: 4 },
  lineItemInputRow: { flexDirection: "row", gap: 8, alignItems: "flex-end" },
  lineInputLabel: {
    fontSize: 11,
    color: theme.colors.mutedForeground,
    marginBottom: 4,
  },
  lineInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: theme.colors.foreground,
    backgroundColor: theme.colors.surface,
  },
  lineSubtotal: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.primary,
    paddingBottom: 8,
  },
  summaryCard: {
    margin: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: { color: theme.colors.mutedForeground, fontSize: 14 },
  summaryValue: { color: theme.colors.foreground, fontSize: 14 },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
    marginTop: 4,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.foreground,
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.primary,
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

export default GoodsReceiptFormScreen;
