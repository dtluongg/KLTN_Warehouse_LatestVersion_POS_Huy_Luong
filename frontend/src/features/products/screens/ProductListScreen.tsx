import React, { useState, useEffect } from "react";
import {
  Image,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { DataTableScreen, StatusBadge, formatMoney } from "../../../components";
import {
  exportProductsToExcel,
  downloadProductTemplate,
  importProductsFromExcel,
} from "../../../api/productApi";
import { showAlert } from "../../../utils/alerts";
import { useTheme } from "../../../hooks/useTheme";
import { axiosClient } from "../../../api/axiosClient";

import { theme } from "../../../utils/theme";
const ProductListScreen = () => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [tableKey, setTableKey] = useState(0);

  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosClient.get("/categories?size=200");
        if (res.data && Array.isArray(res.data.content)) {
          setCategories(res.data.content);
        }
      } catch (error) {
        console.error("Lỗi tải danh mục", error);
      }
    };
    fetchCategories();
  }, []);

  const handleExport = async (filters: any, searchKeyword: string) => {
    try {
      setExporting(true);
      await exportProductsToExcel({ ...filters, search: searchKeyword });
      showAlert("Thành công", "Đã xuất file Excel.");
    } catch (error: any) {
      showAlert("Lỗi", error?.message || "Không thể xuất file.");
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadProductTemplate();
      showAlert("Thành công", "Đã tải file mẫu.");
    } catch (error: any) {
      showAlert("Lỗi", error?.message || "Không thể tải file mẫu.");
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];
      setImporting(true);

      const res = await importProductsFromExcel(
        file.uri,
        file.mimeType ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        file.name,
      );
      const success = res.successCount || 0;
      const errors = res.errors || [];

      if (errors.length > 0) {
        showAlert(
          "Import hoàn tất với một số lỗi",
          "Thành công: " +
            success +
            "\nLỗi:\n" +
            errors.slice(0, 5).join("\n") +
            (errors.length > 5 ? "\n..." : ""),
        );
      } else {
        showAlert("Thành công", "Đã import " + success + " sản phẩm.");
      }
      setTableKey((prev) => prev + 1); // reload table
    } catch (error: any) {
      showAlert(
        "Lỗi",
        error?.response?.data?.error || error?.message || "Không thể import.",
      );
    } finally {
      setImporting(false);
    }
  };

  const extraHeaderActions = (filters: any, searchKeyword: string) => (
    <View style={{ flexDirection: "row", gap: 8, marginRight: 8 }}>
      <TouchableOpacity
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 8,
        }}
        onPress={handleDownloadTemplate}
      >
        <Feather name="file-text" size={16} color={colors.textSecondary} />
        <Text
          style={{
            color: colors.textSecondary,
            fontWeight: "600",
            fontSize: 13,
          }}
        >
          File Mẫu
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 8,
        }}
        onPress={handleImport}
        disabled={importing}
      >
        {importing ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Feather name="upload" size={16} color={colors.primary} />
        )}
        <Text
          style={{ color: colors.primary, fontWeight: "600", fontSize: 13 }}
        >
          Import
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 8,
        }}
        onPress={() => handleExport(filters, searchKeyword)}
        disabled={exporting}
      >
        {exporting ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Feather name="download" size={16} color={colors.primary} />
        )}
        <Text
          style={{ color: colors.primary, fontWeight: "600", fontSize: 13 }}
        >
          Export
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <DataTableScreen
      key={tableKey}
      extraHeaderActions={extraHeaderActions}
      apiUrl="/products"
      title="Sản phẩm"
      searchPlaceholder="Tìm theo SKU, tên sản phẩm..."
      hideDefaultDetailAction
      renderFilters={(setFilters, currentFilters) => {
        return (
          <View style={{ gap: 20 }}>
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: theme.colors.foreground,
                }}
              >
                Trạng thái:
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                <TouchableOpacity
                  style={[
                    styles.filterPill,
                    !currentFilters.isActive && styles.filterPillActive,
                  ]}
                  onPress={() =>
                    setFilters({ ...currentFilters, isActive: "" })
                  }
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      !currentFilters.isActive && styles.filterPillTextActive,
                    ]}
                  >
                    Tất cả
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterPill,
                    currentFilters.isActive === "true" &&
                      styles.filterPillActive,
                  ]}
                  onPress={() =>
                    setFilters({ ...currentFilters, isActive: "true" })
                  }
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      currentFilters.isActive === "true" &&
                        styles.filterPillTextActive,
                    ]}
                  >
                    Đang KD
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterPill,
                    currentFilters.isActive === "false" &&
                      styles.filterPillActive,
                  ]}
                  onPress={() =>
                    setFilters({ ...currentFilters, isActive: "false" })
                  }
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      currentFilters.isActive === "false" &&
                        styles.filterPillTextActive,
                    ]}
                  >
                    Ngừng KD
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ gap: 8 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: theme.colors.foreground,
                }}
              >
                Danh mục:
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                <TouchableOpacity
                  style={[
                    styles.filterPill,
                    !currentFilters.categoryId && styles.filterPillActive,
                  ]}
                  onPress={() =>
                    setFilters({ ...currentFilters, categoryId: "" })
                  }
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      !currentFilters.categoryId && styles.filterPillTextActive,
                    ]}
                  >
                    Tất cả
                  </Text>
                </TouchableOpacity>

                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.filterPill,
                      currentFilters.categoryId === String(cat.id) &&
                        styles.filterPillActive,
                    ]}
                    onPress={() =>
                      setFilters({
                        ...currentFilters,
                        categoryId: String(cat.id),
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        currentFilters.categoryId === String(cat.id) &&
                          styles.filterPillTextActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );
      }}
      createAction={{
        label: "Thêm sản phẩm",
        onPress: () => navigation.navigate("ProductForm"),
      }}
      rowActions={[
        {
          label: "Sửa",
          tone: "neutral",
          onPress: (row) => navigation.navigate("ProductForm", { id: row.id }),
        },
      ]}
      columns={[
        {
          key: "imageUrl",
          label: "Ảnh",
          width: 60,
          render: (v: string) =>
            v ? (
              <Image
                source={{ uri: v }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 4,
                  resizeMode: "cover",
                }}
              />
            ) : (
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 4,
                  backgroundColor: "#E2E8F0",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 10, color: "#64748B" }}>Trống</Text>
              </View>
            ),
        },
        { key: "sku", label: "SKU", width: 120 },
        { key: "barcode", label: "Barcode", width: 130 },
        { key: "name", label: "Tên sản phẩm", flex: 2 },
        { key: "shortName", label: "Tên ngắn", flex: 1 },
        { key: "categoryName", label: "Danh mục", flex: 1 },
        {
          key: "salePrice",
          label: "Giá bán",
          flex: 1,
          render: (v: any) => <>{formatMoney(v)}</>,
        },
        {
          key: "avgCost",
          label: "Giá vốn TB",
          flex: 1,
          render: (v: any) => <>{formatMoney(v)}</>,
        },
        {
          key: "lastPurchaseCost",
          label: "Giá nhập gần nhất",
          flex: 1,
          render: (v: any) => <>{formatMoney(v)}</>,
        },
        { key: "vatRate", label: "VAT %", width: 90 },
        {
          key: "isActive",
          label: "Trạng thái",
          width: 100,
          render: (v: any) => (
            <StatusBadge status={v ? "ACTIVE" : "INACTIVE"} />
          ),
        },
      ]}
    />
  );
};

export default ProductListScreen;

const styles = StyleSheet.create({
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.colors.foreground,
  },
  filterPillTextActive: {
    color: "#fff",
  },
});
