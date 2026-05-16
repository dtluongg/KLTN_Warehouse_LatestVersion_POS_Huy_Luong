import * as React from "react";
import { useEffect, useState } from "react";
import {
    Alert,
    StyleSheet,
    View,
    ActivityIndicator,
    TouchableOpacity,
    TextInput,
    Modal,
    Image,
    Linking,
    Platform,
} from "react-native";
import { DataTableScreen, StatusBadge, formatMoney } from "../../../components";
import { useAuthStore } from "../../../store/authStore";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../hooks/useTheme";
import { axiosClient } from "../../../api/axiosClient";
import { paymentApi } from "../../../api/paymentApi";
import { Typography } from "../../../components/ui/Typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { QRPaymentModal } from "../../pos/components/QRPaymentModal";
import { showAlert } from "../../../utils/alerts";
import { printDocument } from "../../../utils/printUtils";
import { generateOrderReceiptHTML } from "../../../utils/printTemplates";

const OrderDetailView = ({
    id,
    onShowQr,
    onStatusChanged,
}: {
    id: number;
    onShowQr?: (data: any) => void;
    onStatusChanged?: () => void;
}) => {
    const [detail, setDetail] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { colors, metrics } = useTheme();

    useEffect(() => {
        const checkAndFetchDetail = async () => {
            try {
                // Lấy thông tin cơ bản trước
                let res = await axiosClient.get(`/orders/${id}`);
                let orderData = res.data;

                // Nếu là DRAFT và chuyển khoản, tự động check trạng thái thanh toán
                if (
                    orderData.status === "DRAFT" &&
                    orderData.paymentMethod === "TRANSFER"
                ) {
                    try {
                        const checkRes =
                            await paymentApi.checkPaymentStatus(id);
                        if (
                            checkRes.success &&
                            checkRes.orderStatus !== "DRAFT"
                        ) {
                            // Nếu trạng thái đã thay đổi thành POSTED hoặc CANCELLED
                            // Báo cho OrderListScreen refresh lại
                            if (onStatusChanged) onStatusChanged();
                            return;
                        }
                    } catch (e) {
                        console.log("Error auto-checking payment status:", e);
                    }
                }
                setDetail(orderData);
            } catch (error) {
                console.error("Error fetching order detail", error);
            } finally {
                setLoading(false);
            }
        };
        checkAndFetchDetail();
    }, [id]);

    if (loading || !detail) {
        return (
            <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.detailContainer}>
            <Typography
                variant="bodyEmphasized"
                color={colors.textPrimary}
                style={styles.sectionTitle}
            >
                Danh sách Sản phẩm ({detail.items?.length || 0})
            </Typography>
            <View style={styles.itemList}>
                {detail.items?.map((item: any, index: number) => (
                    <View
                        key={item.id || index}
                        style={[
                            styles.itemRow,
                            {
                                backgroundColor: colors.background,
                                borderColor: colors.border,
                                borderRadius: metrics.borderRadius.medium,
                            },
                        ]}
                    >
                        <View style={styles.itemMain}>
                            <Typography
                                variant="bodyEmphasized"
                                color={colors.textPrimary}
                            >
                                {item.productName} ({item.productSku})
                            </Typography>
                            {item.note ? (
                                <Typography
                                    variant="micro"
                                    color={colors.textSecondary}
                                    style={styles.itemNote}
                                >
                                    Ghi chú: {item.note}
                                </Typography>
                            ) : null}
                        </View>
                        <View style={styles.itemStats}>
                            <Typography
                                variant="caption"
                                color={colors.textSecondary}
                            >
                                SL: {item.qty}
                            </Typography>
                            <Typography
                                variant="bodyEmphasized"
                                color={colors.textPrimary}
                            >
                                {formatMoney(item.salePrice)}
                            </Typography>
                        </View>
                    </View>
                ))}
            </View>
            <View style={styles.summaryRow}>
                <Typography variant="body" color={colors.textSecondary}>
                    Tiền hàng:
                </Typography>
                <Typography variant="bodyEmphasized" color={colors.textPrimary}>
                    {formatMoney(detail.grossAmount)}
                </Typography>
            </View>
            {detail.discountAmount > 0 && (
                <View style={styles.summaryRow}>
                    <Typography variant="body" color={colors.textSecondary}>
                        Chiết khấu thường:
                    </Typography>
                    <Typography variant="bodyEmphasized" color={colors.danger}>
                        - {formatMoney(detail.discountAmount)}
                    </Typography>
                </View>
            )}
            {detail.couponDiscountAmount > 0 && (
                <View style={styles.summaryRow}>
                    <Typography variant="body" color={colors.textSecondary}>
                        Chiết khấu Coupon:
                    </Typography>
                    <Typography variant="bodyEmphasized" color={colors.danger}>
                        - {formatMoney(detail.couponDiscountAmount)}
                    </Typography>
                </View>
            )}
            {detail.surchargeAmount > 0 && (
                <View style={styles.summaryRow}>
                    <Typography variant="body" color={colors.textSecondary}>
                        Phụ phí:
                    </Typography>
                    <Typography
                        variant="bodyEmphasized"
                        color={colors.textPrimary}
                    >
                        + {formatMoney(detail.surchargeAmount)}
                    </Typography>
                </View>
            )}
            <View
                style={[
                    styles.summaryRow,
                    {
                        marginTop: 8,
                        paddingTop: 8,
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                    },
                ]}
            >
                <Typography variant="bodyEmphasized" color={colors.primary}>
                    Tổng tiền khách trả:
                </Typography>
                <Typography variant="heading2" color={colors.primary}>
                    {formatMoney(detail.netAmount)}
                </Typography>
            </View>
        </View>
    );
};

const OrderListScreen = () => {
    const { role } = useAuthStore();
    const navigation = useNavigation<any>();
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const { colors, metrics } = useTheme();

    const [refreshKey, setRefreshKey] = useState(0);

    // QR States
    const [showQrModal, setShowQrModal] = useState(false);
    const [qrData, setQrData] = useState<any>(null);
    const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);
    const [pendingOrderNo, setPendingOrderNo] = useState<string>("");
    const [pendingAmount, setPendingAmount] = useState<number>(0);
    const [timeLeftSec, setTimeLeftSec] = useState(120);

    const handleShowQr = (data: any) => {
        setQrData(data.qrData);
        setTimeLeftSec(data.timeLeftSec);
        setPendingOrderId(data.pendingOrderId);
        setPendingOrderNo(data.pendingOrderNo);
        setPendingAmount(data.pendingAmount);
        setShowQrModal(true);
    };

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

    return (
        <>
            <DataTableScreen
                key={refreshKey}
                apiUrl="/orders"
                title="Đơn hàng"
                searchPlaceholder="Tìm mã đơn hàng..."
                createAction={{
                    label: "Thêm đơn POS",
                    onPress: () => navigation.navigate("Pos"),
                }}
                renderDetailContent={(row) => (
                    <OrderDetailView
                        id={row.id}
                        onShowQr={handleShowQr}
                        onStatusChanged={() =>
                            setRefreshKey((prev) => prev + 1)
                        }
                    />
                )}
                rowActions={[
                    {
                        label: "In",
                        tone: "neutral",
                        onPress: async (row) => {
                            try {
                                const res = await axiosClient.get(
                                    `/orders/${row.id}`,
                                );
                                const html = generateOrderReceiptHTML(res.data);
                                await printDocument(html);
                            } catch (e) {
                                showAlert("Lỗi", "Không thể lấy thông tin in.");
                            }
                        },
                        showOnDesktop: true,
                        showOnMobile: true,
                    },
                    {
                        label: "Mở lại QR",
                        tone: "primary",
                        onPress: async (row) => {
                            try {
                                console.log(
                                    "=== reopenQr called, row.id:",
                                    row.id,
                                );
                                const res = await paymentApi.reopenQr(row.id);
                                console.log(
                                    "=== reopenQr response:",
                                    JSON.stringify(res),
                                );

                                if (res && res.data?.qrData) {
                                    handleShowQr(res.data);
                                } else {
                                    showAlert("Lỗi", "Không thể mở lại QR");
                                }
                            } catch (e: any) {
                                console.log(
                                    "=== reopenQr ERROR:",
                                    JSON.stringify(e?.response?.data),
                                );
                                showAlert(
                                    "Lỗi",
                                    "Không thể mở lại QR: " +
                                        (e?.response?.data?.message ||
                                            e?.message ||
                                            e),
                                );
                                setRefreshKey((prev) => prev + 1); // ← đây là thủ phạm gây "refresh trang"
                            }
                        },
                        shouldShow: (row) =>
                            row.status === "DRAFT" &&
                            row.paymentMethod === "TRANSFER",
                    },
                    {
                        label: "Đổi tiền mặt",
                        tone: "primary",
                        onPress: async (row) => {
                            const message =
                                "Bạn có chắc muốn đổi sang thanh toán tiền mặt?";
                            const execute = async () => {
                                try {
                                    await paymentApi.changePaymentMethod(
                                        row.id,
                                        "CASH",
                                    );
                                    showAlert(
                                        "Thành công",
                                        "Đã đổi sang thanh toán tiền mặt.",
                                    );
                                    setRefreshKey((prev) => prev + 1);
                                } catch (e: any) {
                                    showAlert(
                                        "Lỗi",
                                        "Không thể đổi phương thức: " +
                                            (e?.message || e),
                                    );
                                }
                            };

                            if (Platform.OS === "web") {
                                if (window.confirm(message)) {
                                    await execute();
                                }
                            } else {
                                showAlert("Xác nhận", message, [
                                    { text: "Không", style: "cancel" },
                                    { text: "Xác nhận", onPress: execute },
                                ]);
                            }
                        },
                        shouldShow: (row) =>
                            row.status === "DRAFT" &&
                            row.paymentMethod === "TRANSFER",
                    },
                    {
                        label: "Hủy đơn",
                        tone: "danger",
                        onPress: async (row) => {
                            const message = "Bạn có chắc muốn hủy đơn này?";
                            const execute = async () => {
                                try {
                                    await paymentApi.cancelOrder(row.id);
                                    showAlert(
                                        "Thành công",
                                        "Đơn hàng đã được hủy.",
                                    );
                                    setRefreshKey((prev) => prev + 1);
                                } catch (e: any) {
                                    showAlert(
                                        "Lỗi",
                                        "Không thể hủy đơn: " +
                                            (e?.message || e),
                                    );
                                }
                            };

                            if (Platform.OS === "web") {
                                if (window.confirm(message)) {
                                    await execute();
                                }
                            } else {
                                showAlert("Xác nhận", message, [
                                    { text: "Không", style: "cancel" },
                                    {
                                        text: "Hủy đơn",
                                        style: "destructive",
                                        onPress: execute,
                                    },
                                ]);
                            }
                        },
                        shouldShow: (row) => row.status === "DRAFT",
                    },
                ]}
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
                            fromDate: fromDateStr + "T00:00:00",
                            toDate: toDateStr + "T23:59:59",
                        });
                    };

                    return (
                        <View style={{ gap: 20 }}>
                            {/* Time Filter */}
                            <View style={{ gap: 8 }}>
                                <Typography
                                    variant="captionBold"
                                    color={colors.textPrimary}
                                >
                                    Thời gian đặt:
                                </Typography>
                                <View
                                    style={{
                                        flexDirection: "row",
                                        flexWrap: "wrap",
                                        gap: 6,
                                    }}
                                >
                                    {datePresets.map((preset) => {
                                        const isActive =
                                            (currentFilters.datePreset ||
                                                "") === preset.value;
                                        return (
                                            <TouchableOpacity
                                                key={preset.value}
                                                style={[
                                                    styles.filterPill,
                                                    {
                                                        borderColor:
                                                            colors.border,
                                                        borderRadius:
                                                            metrics.borderRadius
                                                                .full,
                                                    },
                                                    isActive && {
                                                        backgroundColor:
                                                            "rgba(0,113,227,0.1)",
                                                        borderColor:
                                                            colors.primary,
                                                    },
                                                ]}
                                                onPress={() =>
                                                    handleSelectDatePreset(
                                                        preset.value,
                                                    )
                                                }
                                            >
                                                <Typography
                                                    variant="bodyEmphasized"
                                                    color={
                                                        isActive
                                                            ? colors.primary
                                                            : colors.textPrimary
                                                    }
                                                >
                                                    {preset.label}
                                                </Typography>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {/* Custom Date Picker Inputs */}
                                {currentFilters.datePreset === "custom" && (
                                    <View
                                        style={{
                                            flexDirection: "row",
                                            gap: 12,
                                            marginTop: 4,
                                        }}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Typography
                                                variant="micro"
                                                color={colors.textSecondary}
                                                style={{ marginBottom: 4 }}
                                            >
                                                Từ ngày:
                                            </Typography>
                                            <TextInput
                                                style={[
                                                    styles.dateInput,
                                                    {
                                                        borderColor:
                                                            colors.border,
                                                        borderRadius:
                                                            metrics.borderRadius
                                                                .md,
                                                        color: colors.textPrimary,
                                                        backgroundColor:
                                                            colors.background,
                                                    },
                                                ]}
                                                placeholder="YYYY-MM-DD"
                                                value={
                                                    currentFilters.fromDate?.split(
                                                        "T",
                                                    )[0] || ""
                                                }
                                                onChangeText={(text) =>
                                                    setFilters({
                                                        ...currentFilters,
                                                        fromDate: text
                                                            ? text + "T00:00:00"
                                                            : "",
                                                    })
                                                }
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Typography
                                                variant="micro"
                                                color={colors.textSecondary}
                                                style={{ marginBottom: 4 }}
                                            >
                                                Đến ngày:
                                            </Typography>
                                            <TextInput
                                                style={[
                                                    styles.dateInput,
                                                    {
                                                        borderColor:
                                                            colors.border,
                                                        borderRadius:
                                                            metrics.borderRadius
                                                                .md,
                                                        color: colors.textPrimary,
                                                        backgroundColor:
                                                            colors.background,
                                                    },
                                                ]}
                                                placeholder="YYYY-MM-DD"
                                                value={
                                                    currentFilters.toDate?.split(
                                                        "T",
                                                    )[0] || ""
                                                }
                                                onChangeText={(text) =>
                                                    setFilters({
                                                        ...currentFilters,
                                                        toDate: text
                                                            ? text + "T23:59:59"
                                                            : "",
                                                    })
                                                }
                                            />
                                        </View>
                                    </View>
                                )}
                            </View>

                            {/* Status Filter */}
                            <View style={{ gap: 8 }}>
                                <Typography
                                    variant="captionBold"
                                    color={colors.textSecondary}
                                    style={{
                                        textTransform: "uppercase",
                                        letterSpacing: 1,
                                    }}
                                >
                                    Trạng thái
                                </Typography>
                                <View
                                    style={{
                                        flexDirection: "row",
                                        backgroundColor: "rgba(0,0,0,0.04)",
                                        padding: 4,
                                        borderRadius: 99,
                                        alignSelf: "flex-start",
                                    }}
                                >
                                    <TouchableOpacity
                                        style={[
                                            styles.filterPill,
                                            !currentFilters.status && {
                                                backgroundColor: colors.surface,
                                            },
                                        ]}
                                        onPress={() =>
                                            setFilters({
                                                ...currentFilters,
                                                status: "",
                                            })
                                        }
                                    >
                                        <Typography
                                            variant="bodyEmphasized"
                                            color={colors.textPrimary}
                                        >
                                            All Status
                                        </Typography>
                                    </TouchableOpacity>
                                    {statuses.map((st) => (
                                        <TouchableOpacity
                                            key={st}
                                            style={[
                                                styles.filterPill,
                                                currentFilters.status ===
                                                    st && {
                                                    backgroundColor:
                                                        colors.surface,
                                                },
                                            ]}
                                            onPress={() =>
                                                setFilters({
                                                    ...currentFilters,
                                                    status: st,
                                                })
                                            }
                                        >
                                            <Typography
                                                variant="bodyEmphasized"
                                                color={colors.textPrimary}
                                            >
                                                {st}
                                            </Typography>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Warehouse Filter */}
                            <View
                                style={{
                                    flexDirection: "row",
                                    gap: 20,
                                    flexWrap: "wrap",
                                }}
                            >
                                <View
                                    style={{ flex: 1, minWidth: 200, gap: 8 }}
                                >
                                    <Typography
                                        variant="captionBold"
                                        color={colors.textPrimary}
                                    >
                                        Kho Hàng:
                                    </Typography>
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
                                                {
                                                    borderColor: colors.border,
                                                    borderRadius:
                                                        metrics.borderRadius
                                                            .full,
                                                },
                                                !currentFilters.warehouseId && {
                                                    backgroundColor:
                                                        "rgba(0,113,227,0.1)",
                                                    borderColor: colors.primary,
                                                },
                                            ]}
                                            onPress={() =>
                                                setFilters({
                                                    ...currentFilters,
                                                    warehouseId: "",
                                                })
                                            }
                                        >
                                            <Typography
                                                variant="bodyEmphasized"
                                                color={
                                                    !currentFilters.warehouseId
                                                        ? colors.primary
                                                        : colors.textPrimary
                                                }
                                            >
                                                Tất cả
                                            </Typography>
                                        </TouchableOpacity>

                                        {warehouses.map((w) => (
                                            <TouchableOpacity
                                                key={w.id}
                                                style={[
                                                    styles.filterPill,
                                                    {
                                                        borderColor:
                                                            colors.border,
                                                        borderRadius:
                                                            metrics.borderRadius
                                                                .full,
                                                    },
                                                    currentFilters.warehouseId ===
                                                        String(w.id) && {
                                                        backgroundColor:
                                                            "rgba(0,113,227,0.1)",
                                                        borderColor:
                                                            colors.primary,
                                                    },
                                                ]}
                                                onPress={() =>
                                                    setFilters({
                                                        ...currentFilters,
                                                        warehouseId: String(
                                                            w.id,
                                                        ),
                                                    })
                                                }
                                            >
                                                <Typography
                                                    variant="bodyEmphasized"
                                                    color={
                                                        currentFilters.warehouseId ===
                                                        String(w.id)
                                                            ? colors.primary
                                                            : colors.textPrimary
                                                    }
                                                >
                                                    {w.name}
                                                </Typography>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        </View>
                    );
                }}
                columns={[
                    { key: "orderNo", label: "Mã đơn", width: 130 },
                    { key: "salesChannel", label: "Kênh", width: 80 },
                    { key: "customerName", label: "Khách hàng", flex: 1 },
                    { key: "warehouseName", label: "Kho", flex: 1 },
                    {
                        key: "orderTime",
                        label: "Ngày",
                        flex: 1,
                        render: (v: any) => (
                            <>
                                {v
                                    ? new Date(v).toLocaleDateString("vi-VN")
                                    : "—"}
                            </>
                        ),
                    },
                    {
                        key: "grossAmount",
                        label: "Tiền hàng",
                        flex: 1,
                        render: (v: any) => <>{formatMoney(v)}</>,
                    },
                    {
                        key: "status",
                        label: "Trạng thái",
                        width: 110,
                        render: (v: any) => <StatusBadge status={v || "—"} />,
                    },
                    { key: "paymentMethod", label: "P.Thức", width: 100 },
                    {
                        key: "netAmount",
                        label: "Tổng tiền",
                        flex: 1,
                        render: (v: any) => <>{formatMoney(v)}</>,
                    },
                    { key: "createdBy", label: "Nhân viên", flex: 1 },
                    { key: "note", label: "Ghi chú", flex: 1.5 },
                ]}
            />
            <QRPaymentModal
                visible={showQrModal}
                qrData={qrData}
                pendingOrderId={pendingOrderId}
                pendingOrderNo={pendingOrderNo}
                pendingAmount={pendingAmount}
                initialTimeLeftSec={timeLeftSec}
                onClose={() => {
                    setShowQrModal(false);
                    setPendingOrderId(null);
                }}
                onSuccess={() => {
                    setShowQrModal(false);
                    setPendingOrderId(null);
                    showAlert(
                        "Thành công",
                        `Đơn #${pendingOrderNo} đã thanh toán thành công.`,
                    );
                    setRefreshKey((prev) => prev + 1);
                }}
                onCancel={() => {
                    setShowQrModal(false);
                    setPendingOrderId(null);
                    showAlert("Hủy", `Đơn #${pendingOrderNo} đã bị huỷ.`);
                    setRefreshKey((prev) => prev + 1);
                }}
            />
        </>
    );
};

export default OrderListScreen;

const styles = StyleSheet.create({
    detailContainer: {
        marginTop: 10,
    },
    sectionTitle: {
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
        borderWidth: 1,
    },
    itemMain: {
        flex: 1,
        gap: 4,
    },
    itemNote: {
        fontStyle: "italic",
    },
    itemStats: {
        alignItems: "flex-end",
        gap: 4,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 4,
    },
    filterPill: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 99,
    },
    dateInput: {
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
    },
});
