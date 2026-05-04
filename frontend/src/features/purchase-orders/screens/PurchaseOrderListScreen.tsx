import * as React from "react";
import { useEffect, useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    TouchableOpacity,
    TextInput,
    Platform,
} from "react-native";
import { DataTableScreen, StatusBadge, formatMoney } from "../../../components";
import { useAuthStore } from "../../../store/authStore";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../../../utils/theme";
import { axiosClient } from "../../../api/axiosClient";
import { showAlert } from "../../../utils/alerts";
import { printDocument } from "../../../utils/printUtils";
import { generatePurchaseOrderHTML } from "../../../utils/printTemplates";

const formatDateTime = (value: string | null | undefined) => {
    if (!value) return "—";
    const d = new Date(value);
    return `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
};

const confirmAction = async (
    title: string,
    message: string,
    confirmText: string,
    destructive = false,
): Promise<boolean> => {
    if (Platform.OS === "web" && typeof globalThis.confirm === "function") {
        return globalThis.confirm(`${title}\n\n${message}`);
    }

    return new Promise<boolean>((resolve) => {
        showAlert(title, message, [
            { text: "Không", style: "cancel", onPress: () => resolve(false) },
            {
                text: confirmText,
                style: destructive ? "destructive" : "default",
                onPress: () => resolve(true),
            },
        ]);
    });
};

const getErrorMessage = (error: any, fallback: string) => {
    return error?.response?.data?.message || fallback;
};

const PurchaseOrderDetailView = ({ id }: { id: number }) => {
    const [detail, setDetail] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await axiosClient.get(`/purchase-orders/${id}`);
                setDetail(res.data);
            } catch (error) {
                console.error("Error fetching purchase order detail", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    if (loading || !detail) {
        return (
            <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.detailContainer}>
            <Text style={styles.sectionTitle}>
                Danh sách Sản phẩm ({detail.items?.length || 0})
            </Text>
            <View style={styles.itemList}>
                {detail.items?.map((item: any, index: number) => (
                    <View key={item.id || index} style={styles.itemRow}>
                        <View style={styles.itemMain}>
                            <Text style={styles.itemName}>
                                {item.productName} ({item.productSku})
                            </Text>
                            <Text style={styles.itemNote}>
                                Đặt: {item.orderedQty} | Đã nhận:{" "}
                                {item.receivedQty ?? 0} | Còn lại:{" "}
                                {item.remainingQty ?? item.orderedQty}
                            </Text>
                        </View>
                        <View style={styles.itemStats}>
                            <Text style={styles.itemQty}>
                                SL đặt: {item.orderedQty}
                            </Text>
                            <Text style={styles.itemAmount}>
                                {formatMoney(item.lineTotal)}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>
            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tiến độ nhận:</Text>
                <StatusBadge
                    status={detail.receiptProgress || "NOT_RECEIVED"}
                />
            </View>
            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Đóng PO:</Text>
                <Text style={styles.summaryValue}>
                    {detail.closedAt ? formatDateTime(detail.closedAt) : "Chưa"}
                </Text>
            </View>
            {detail.closedReason ? (
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Lý do đóng:</Text>
                    <Text style={styles.summaryValue}>
                        {detail.closedReason}
                    </Text>
                </View>
            ) : null}
            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tiền hàng:</Text>
                <Text style={styles.summaryValue}>
                    {formatMoney(detail.totalAmount)}
                </Text>
            </View>
            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Thuế VAT:</Text>
                <Text style={styles.summaryValue}>
                    {formatMoney(detail.totalVat)}
                </Text>
            </View>
            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Chiết khấu:</Text>
                <Text
                    style={[styles.summaryValue, { color: theme.colors.error }]}
                >
                    - {formatMoney(detail.discountAmount || 0)}
                </Text>
            </View>
            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Phụ phí:</Text>
                <Text style={styles.summaryValue}>
                    + {formatMoney(detail.surchargeAmount || 0)}
                </Text>
            </View>
            <View
                style={[
                    styles.summaryRow,
                    {
                        marginTop: 8,
                        paddingTop: 8,
                        borderTopWidth: 1,
                        borderTopColor: theme.colors.border,
                    },
                ]}
            >
                <Text
                    style={[
                        styles.summaryLabel,
                        { fontWeight: "700", color: theme.colors.primary },
                    ]}
                >
                    Cần trả NCC:
                </Text>
                <Text
                    style={[
                        styles.summaryValue,
                        {
                            fontWeight: "700",
                            color: theme.colors.primary,
                            fontSize: 16,
                        },
                    ]}
                >
                    {formatMoney(detail.totalAmountPayable)}
                </Text>
            </View>
        </View>
    );
};

const PurchaseOrderListScreen = () => {
    const { role } = useAuthStore();
    const navigation = useNavigation<any>();
    const [warehouses, setWarehouses] = useState<any[]>([]);

    useEffect(() => {
        const fetchWarehouses = async () => {
            try {
                const res = await axiosClient.get("/warehouses");
                if (Array.isArray(res.data)) {
                    setWarehouses(res.data);
                } else if (res.data && Array.isArray(res.data.content)) {
                    setWarehouses(res.data.content);
                }
            } catch (err) {
                console.error("Failed to load warehouses", err);
            }
        };
        fetchWarehouses();
    }, []);

    const approvePurchaseOrder = async (row: any) => {
        const confirmed = await confirmAction(
            "Duyệt PO",
            `Duyệt ${row?.poNo || "phiếu"}?`,
            "Duyệt",
        );
        if (!confirmed) return;

        try {
            await axiosClient.put(
                `/purchase-orders/${row.id}/status?status=POSTED`,
            );
            showAlert("Thành công", `Đã duyệt ${row?.poNo || "phiếu"}.`);
        } catch (error: any) {
            showAlert(
                "Lỗi",
                getErrorMessage(error, "Không thể duyệt phiếu PO."),
            );
            throw error;
        }
    };

    const cancelDraftPurchaseOrder = async (row: any) => {
        const confirmed = await confirmAction(
            "Hủy PO",
            `Hủy ${row?.poNo || "phiếu"}?`,
            "Hủy phiếu",
            true,
        );
        if (!confirmed) return;

        try {
            await axiosClient.put(
                `/purchase-orders/${row.id}/status?status=CANCELLED`,
            );
            showAlert("Thành công", `Đã hủy ${row?.poNo || "phiếu"}.`);
        } catch (error: any) {
            showAlert(
                "Lỗi",
                getErrorMessage(error, "Không thể hủy phiếu PO."),
            );
            throw error;
        }
    };

    const closePurchaseOrder = async (row: any, reason: string) => {
        try {
            await axiosClient.post(
                `/purchase-orders/${row.id}/close?reason=${reason}`,
            );
            showAlert("Thành công", `Đã đóng ${row?.poNo || "phiếu"}.`);
        } catch (error: any) {
            showAlert(
                "Lỗi",
                getErrorMessage(error, "Không thể đóng phiếu PO."),
            );
            throw error;
        }
    };

    const promptClosePurchaseOrder = async (row: any) => {
        const choice = await new Promise<string | null>((resolve) => {
            if (
                Platform.OS === "web" &&
                typeof globalThis.prompt === "function"
            ) {
                const answer = globalThis.prompt(
                    [
                        `Đóng ${row?.poNo || "phiếu"} với lý do nào?`,
                        "1 - Ngưng giao hàng",
                        "2 - Chấp nhận nhận thiếu",
                        "3 - Đóng thủ công",
                    ].join("\n"),
                    "1",
                );

                if (answer === null) {
                    resolve(null);
                    return;
                }

                const normalized = answer.trim();
                if (normalized === "1") {
                    resolve("SUPPLIER_UNABLE_TO_DELIVER");
                    return;
                }
                if (normalized === "2") {
                    resolve("PARTIALLY_RECEIVED_ACCEPTED");
                    return;
                }
                if (normalized === "3") {
                    resolve("MANUAL_CLOSE");
                    return;
                }

                resolve(null);
                return;
            }

            showAlert("Đóng PO", `Chọn lý do đóng ${row?.poNo || "phiếu"}:`, [
                {
                    text: "Ngưng giao hàng",
                    onPress: () => resolve("SUPPLIER_UNABLE_TO_DELIVER"),
                },
                {
                    text: "Chấp nhận nhận thiếu",
                    onPress: () => resolve("PARTIALLY_RECEIVED_ACCEPTED"),
                },
                {
                    text: "Đóng thủ công",
                    onPress: () => resolve("MANUAL_CLOSE"),
                },
                {
                    text: "Không",
                    style: "cancel",
                    onPress: () => resolve(null),
                },
            ]);
        });

        if (!choice) return;
        await closePurchaseOrder(row, choice);
    };

    return (
        <DataTableScreen
            apiUrl="/purchase-orders"
            title="Đặt hàng NCC"
            searchPlaceholder="Tìm mã PO, nhà cung cấp..."
            mobilePreviewCount={10}
            createAction={{
                label: "Thêm PO",
                onPress: () => navigation.navigate("PurchaseOrderForm"),
            }}
            rowActions={[
                {
                    label: "Sửa",
                    tone: "neutral",
                    shouldShow: (row) => row?.status === "DRAFT",
                    onPress: (row) =>
                        navigation.navigate("PurchaseOrderForm", {
                            id: row.id,
                        }),
                },
                {
                    label: "In",
                    tone: "neutral",
                    onPress: async (row) => {
                        try {
                            const res = await axiosClient.get(`/purchase-orders/${row.id}`);
                            const html = generatePurchaseOrderHTML(res.data);
                            await printDocument(html);
                        } catch (e) {
                            showAlert("Lỗi", "Không thể lấy thông tin in.");
                        }
                    },
                },
                {
                    label: "Duyệt",
                    onPress: approvePurchaseOrder,
                    shouldShow: (row) =>
                        role === "ADMIN" &&
                        String(row?.status || "") === "DRAFT",
                },
                {
                    label: "Hủy",
                    tone: "danger",
                    onPress: cancelDraftPurchaseOrder,
                    shouldShow: (row) =>
                        role === "ADMIN" &&
                        String(row?.status || "") === "DRAFT",
                },
                {
                    label: "Đóng PO",
                    tone: "danger",
                    onPress: promptClosePurchaseOrder,
                    shouldShow: (row) =>
                        role === "ADMIN" &&
                        String(row?.status || "") === "POSTED" &&
                        !row?.closedAt &&
                        String(row?.receiptProgress || "") !== "FULLY_RECEIVED",
                },
            ]}
            renderDetailContent={(row) => (
                <PurchaseOrderDetailView id={row.id} />
            )}
            renderFilters={(setFilters, currentFilters) => {
                const statuses = ["DRAFT", "POSTED", "CANCELLED"];

                const datePresets = [
                    { value: "", label: "Tất cả thời gian" },
                    { value: "today", label: "Hôm nay" },
                    { value: "this_week", label: "Tuần này" },
                    { value: "this_month", label: "Tháng này" },
                    { value: "7days", label: "7 ngày qua" },
                    { value: "30days", label: "30 ngày qua" },
                    { value: "custom", label: "Tuỳ chỉnh..." },
                ];

                const handleSelectDatePreset = (preset: string) => {
                    if (!preset) {
                        setFilters({
                            ...currentFilters,
                            datePreset: "",
                            fromDate: "",
                            toDate: "",
                        });
                        return;
                    }
                    if (preset === "custom") {
                        setFilters({
                            ...currentFilters,
                            datePreset: "custom",
                            fromDate: currentFilters.fromDate,
                            toDate: currentFilters.toDate,
                        });
                        return;
                    }
                    const today = new Date();
                    const formatDate = (date: Date) => {
                        const d = new Date(date);
                        let month = "" + (d.getMonth() + 1);
                        let day = "" + d.getDate();
                        const year = d.getFullYear();
                        if (month.length < 2) month = "0" + month;
                        if (day.length < 2) day = "0" + day;
                        return [year, month, day].join("-");
                    };

                    const toDateStr = formatDate(today);
                    let fromDateStr = "";

                    if (preset === "today") {
                        fromDateStr = toDateStr;
                    } else if (preset === "this_week") {
                        const monday = new Date(today);
                        const day = monday.getDay() || 7;
                        monday.setDate(monday.getDate() - day + 1);
                        fromDateStr = formatDate(monday);
                    } else if (preset === "7days") {
                        const last7 = new Date(today);
                        last7.setDate(today.getDate() - 7);
                        fromDateStr = formatDate(last7);
                    } else if (preset === "30days") {
                        const last30 = new Date(today);
                        last30.setDate(today.getDate() - 30);
                        fromDateStr = formatDate(last30);
                    } else if (preset === "this_month") {
                        const firstDay = new Date(
                            today.getFullYear(),
                            today.getMonth(),
                            1,
                        );
                        fromDateStr = formatDate(firstDay);
                    }

                    setFilters({
                        ...currentFilters,
                        datePreset: preset,
                        fromDate: fromDateStr,
                        toDate: toDateStr,
                    });
                };

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
                                Ngày đặt hàng:
                            </Text>
                            <View
                                style={{
                                    flexDirection: "row",
                                    flexWrap: "wrap",
                                    gap: 6,
                                }}
                            >
                                {datePresets.map((preset) => {
                                    const isActive =
                                        (currentFilters.datePreset || "") ===
                                        preset.value;
                                    return (
                                        <TouchableOpacity
                                            key={preset.value}
                                            style={[
                                                styles.filterPill,
                                                isActive &&
                                                    styles.filterPillActive,
                                            ]}
                                            onPress={() =>
                                                handleSelectDatePreset(
                                                    preset.value,
                                                )
                                            }
                                        >
                                            <Text
                                                style={[
                                                    styles.filterPillText,
                                                    isActive &&
                                                        styles.filterPillTextActive,
                                                ]}
                                            >
                                                {preset.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {currentFilters.datePreset === "custom" && (
                                <View
                                    style={{
                                        flexDirection: "row",
                                        gap: 12,
                                        marginTop: 4,
                                    }}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={{
                                                fontSize: 12,
                                                color: theme.colors
                                                    .mutedForeground,
                                                marginBottom: 4,
                                            }}
                                        >
                                            Từ ngày:
                                        </Text>
                                        <TextInput
                                            style={styles.dateInput}
                                            placeholder="YYYY-MM-DD"
                                            value={
                                                currentFilters.fromDate || ""
                                            }
                                            onChangeText={(text) =>
                                                setFilters({
                                                    ...currentFilters,
                                                    fromDate: text,
                                                })
                                            }
                                            {...({ type: "date" } as any)}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={{
                                                fontSize: 12,
                                                color: theme.colors
                                                    .mutedForeground,
                                                marginBottom: 4,
                                            }}
                                        >
                                            Đến ngày:
                                        </Text>
                                        <TextInput
                                            style={styles.dateInput}
                                            placeholder="YYYY-MM-DD"
                                            value={currentFilters.toDate || ""}
                                            onChangeText={(text) =>
                                                setFilters({
                                                    ...currentFilters,
                                                    toDate: text,
                                                })
                                            }
                                            {...({ type: "date" } as any)}
                                        />
                                    </View>
                                </View>
                            )}
                        </View>

                        <View style={{ gap: 8 }}>
                            <Text
                                style={{
                                    fontSize: 13,
                                    fontWeight: "600",
                                    color: theme.colors.foreground,
                                }}
                            >
                                Trạng thái phiếu:
                            </Text>
                            <View
                                style={{
                                    flexDirection: "row",
                                    flexWrap: "wrap",
                                    gap: 6,
                                }}
                            >
                                <TouchableOpacity
                                    style={[
                                        styles.filterPill,
                                        !currentFilters.status &&
                                            styles.filterPillActive,
                                    ]}
                                    onPress={() =>
                                        setFilters({
                                            ...currentFilters,
                                            status: "",
                                        })
                                    }
                                >
                                    <Text
                                        style={[
                                            styles.filterPillText,
                                            !currentFilters.status &&
                                                styles.filterPillTextActive,
                                        ]}
                                    >
                                        Tất cả
                                    </Text>
                                </TouchableOpacity>
                                {statuses.map((st) => (
                                    <TouchableOpacity
                                        key={st}
                                        style={[
                                            styles.filterPill,
                                            currentFilters.status === st &&
                                                styles.filterPillActive,
                                        ]}
                                        onPress={() =>
                                            setFilters({
                                                ...currentFilters,
                                                status: st,
                                            })
                                        }
                                    >
                                        <Text
                                            style={[
                                                styles.filterPillText,
                                                currentFilters.status === st &&
                                                    styles.filterPillTextActive,
                                            ]}
                                        >
                                            {st}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View
                            style={{
                                flexDirection: "row",
                                gap: 20,
                                flexWrap: "wrap",
                            }}
                        >
                            <View style={{ flex: 1, minWidth: 200, gap: 8 }}>
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontWeight: "600",
                                        color: theme.colors.foreground,
                                    }}
                                >
                                    Kho Hàng:
                                </Text>
                                <View
                                    style={{
                                        flexDirection: "row",
                                        flexWrap: "wrap",
                                        gap: 6,
                                    }}
                                >
                                    <TouchableOpacity
                                        style={[
                                            styles.filterPill,
                                            !currentFilters.warehouseId &&
                                                styles.filterPillActive,
                                        ]}
                                        onPress={() =>
                                            setFilters({
                                                ...currentFilters,
                                                warehouseId: "",
                                            })
                                        }
                                    >
                                        <Text
                                            style={[
                                                styles.filterPillText,
                                                !currentFilters.warehouseId &&
                                                    styles.filterPillTextActive,
                                            ]}
                                        >
                                            Tất cả
                                        </Text>
                                    </TouchableOpacity>

                                    {warehouses.map((w) => (
                                        <TouchableOpacity
                                            key={w.id}
                                            style={[
                                                styles.filterPill,
                                                currentFilters.warehouseId ===
                                                    String(w.id) &&
                                                    styles.filterPillActive,
                                            ]}
                                            onPress={() =>
                                                setFilters({
                                                    ...currentFilters,
                                                    warehouseId: String(w.id),
                                                })
                                            }
                                        >
                                            <Text
                                                style={[
                                                    styles.filterPillText,
                                                    currentFilters.warehouseId ===
                                                        String(w.id) &&
                                                        styles.filterPillTextActive,
                                                ]}
                                            >
                                                {w.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </View>
                );
            }}
            columns={[
                { key: "poNo", label: "Mã PO", width: 130 },
                { key: "supplierName", label: "Nhà cung cấp", flex: 1.5 },
                { key: "warehouseName", label: "Kho", flex: 1 },
                { key: "orderDate", label: "Ngày đặt", flex: 1 },
                { key: "expectedDate", label: "Ngày dự kiến", flex: 1 },
                {
                    key: "totalAmountPayable",
                    label: "Tổng tiền",
                    flex: 1,
                    render: (v: any) => <>{formatMoney(v)}</>,
                },
                {
                    key: "status",
                    label: "Trạng thái",
                    width: 110,
                    render: (v: any) => <StatusBadge status={v || "—"} />,
                },
                {
                    key: "receiptProgress",
                    label: "Tiến độ nhận",
                    width: 150,
                    render: (v: any) => (
                        <StatusBadge status={v || "NOT_RECEIVED"} />
                    ),
                },
                {
                    key: "createdAt",
                    label: "Ngày tạo",
                    width: 150,
                    render: (v: any) => {
                        if (!v)
                            return (
                                <Text
                                    style={{
                                        color: theme.colors.mutedForeground,
                                    }}
                                >
                                    —
                                </Text>
                            );
                        return <Text>{formatDateTime(v)}</Text>;
                    },
                },
                { key: "createdBy", label: "Người tạo", flex: 1 },
                { key: "note", label: "Ghi chú", flex: 1.5 },
            ]}
        />
    );
};

export default PurchaseOrderListScreen;

const styles = StyleSheet.create({
    detailContainer: {
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: theme.colors.foreground,
        marginBottom: 12,
    },
    itemList: {
        gap: 8,
        marginBottom: 20,
    },
    itemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 12,
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    itemMain: {
        flex: 1,
        gap: 4,
    },
    itemName: {
        fontSize: 14,
        fontWeight: "600",
        color: theme.colors.foreground,
    },
    itemNote: {
        fontSize: 12,
        color: theme.colors.mutedForeground,
        fontStyle: "italic",
    },
    itemStats: {
        alignItems: "flex-end",
        gap: 4,
    },
    itemQty: {
        fontSize: 13,
        fontWeight: "500",
        color: theme.colors.mutedForeground,
    },
    itemAmount: {
        fontSize: 14,
        fontWeight: "700",
        color: theme.colors.foreground,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 4,
    },
    summaryLabel: {
        fontSize: 14,
        color: theme.colors.mutedForeground,
        fontWeight: "500",
    },
    summaryValue: {
        fontSize: 15,
        color: theme.colors.foreground,
        fontWeight: "600",
    },
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
    dateInput: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        color: theme.colors.foreground,
        backgroundColor: theme.colors.background,
    },
});
