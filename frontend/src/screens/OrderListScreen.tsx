import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { DataTableScreen, StatusBadge, formatMoney } from "../components";
import { axiosClient } from "../api/axiosClient";
import { theme } from "../utils/theme";

type OrderItemDetail = {
    id: number;
    qty: number;
    salePrice: number;
    lineRevenue: number;
    product?: {
        id: number;
        sku?: string;
        name?: string;
    };
};

const OrderListScreen = () => {
    const [detailVisible, setDetailVisible] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [orderDetail, setOrderDetail] = useState<any | null>(null);
    const [orderItems, setOrderItems] = useState<OrderItemDetail[]>([]);

    const closeDetail = () => {
        setDetailVisible(false);
        setOrderDetail(null);
        setOrderItems([]);
    };

    const openOrderDetail = async (row: any) => {
        try {
            setDetailVisible(true);
            setDetailLoading(true);

            const [detailRes, itemsRes] = await Promise.all([
                axiosClient.get(`/orders/${row.id}`),
                axiosClient
                    .get(`/orders/${row.id}/items`)
                    .catch(() => ({ data: [] })),
            ]);

            setOrderDetail(detailRes.data || null);
            setOrderItems(Array.isArray(itemsRes.data) ? itemsRes.data : []);
        } catch (error) {
            Alert.alert("Lỗi", "Không thể tải chi tiết đơn hàng.");
            closeDetail();
        } finally {
            setDetailLoading(false);
        }
    };

    const printOrder = async (row: any) => {
        let detail = orderDetail;
        let items = orderItems;

        if (!detail || detail.id !== row.id) {
            try {
                const [detailRes, itemsRes] = await Promise.all([
                    axiosClient.get(`/orders/${row.id}`),
                    axiosClient
                        .get(`/orders/${row.id}/items`)
                        .catch(() => ({ data: [] })),
                ]);
                detail = detailRes.data || row;
                items = Array.isArray(itemsRes.data) ? itemsRes.data : [];
            } catch {
                detail = row;
                items = [];
            }
        }

        if (Platform.OS !== "web") {
            Alert.alert("In đơn", `Sẵn sàng in đơn ${detail?.orderNo || "-"}.`);
            return;
        }

        const itemLines = items
            .map(
                (it) => `
                <tr>
                    <td>${it.product?.name || "-"}</td>
                    <td style="text-align:right">${formatMoney(it.salePrice)}</td>
                    <td style="text-align:right">${it.qty || 0}</td>
                    <td style="text-align:right">${formatMoney(it.lineRevenue)}</td>
                </tr>`,
            )
            .join("");

        const html = `
            <html>
                <head>
                    <title>In đơn ${detail?.orderNo || ""}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h2 { margin: 0 0 12px 0; }
                        .meta { margin-bottom: 12px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
                        th { background: #f3f4f6; text-align: left; }
                    </style>
                </head>
                <body>
                    <h2>ĐƠN HÀNG ${detail?.orderNo || ""}</h2>
                    <div class="meta">Khách hàng: ${detail?.customer?.name || "Khách lẻ"}</div>
                    <div class="meta">Kho: ${detail?.warehouse?.name || "-"}</div>
                    <div class="meta">Tổng tiền: ${formatMoney(detail?.netAmount)}</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Đơn giá</th>
                                <th>SL</th>
                                <th>Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>${itemLines}</tbody>
                    </table>
                </body>
            </html>
        `;

        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            Alert.alert("Lỗi", "Không mở được cửa sổ in.");
            return;
        }
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    const orderInfo = useMemo(
        () => [
            { label: "Mã đơn", value: orderDetail?.orderNo || "-" },
            { label: "Trạng thái", value: orderDetail?.status || "-" },
            {
                label: "Khách hàng",
                value: orderDetail?.customer?.name || "Khách lẻ",
            },
            { label: "Kho", value: orderDetail?.warehouse?.name || "-" },
            {
                label: "Ngày đặt",
                value: orderDetail?.orderTime
                    ? new Date(orderDetail.orderTime).toLocaleString("vi-VN")
                    : "-",
            },
            {
                label: "Thanh toán",
                value: orderDetail?.paymentMethod || "-",
            },
            {
                label: "Tiền hàng",
                value: formatMoney(orderDetail?.grossAmount),
            },
            { label: "Tổng tiền", value: formatMoney(orderDetail?.netAmount) },
            { label: "Ghi chú", value: orderDetail?.note || "-" },
        ],
        [orderDetail],
    );

    return (
        <>
            <DataTableScreen
                apiUrl="/orders"
                title="Đơn hàng"
                searchPlaceholder="Tìm mã đơn hàng..."
                hideDefaultDetailAction
                rowActions={[
                    {
                        label: "Xem chi tiết đơn",
                        onPress: openOrderDetail,
                        showOnDesktop: true,
                        showOnMobile: true,
                    },
                    {
                        label: "In",
                        tone: "neutral",
                        onPress: printOrder,
                        showOnDesktop: true,
                        showOnMobile: true,
                    },
                ]}
                columns={[
                    { key: "orderNo", label: "Mã đơn", width: 130 },
                    { key: "salesChannel", label: "Kênh", width: 80 },
                    { key: "customer.name", label: "Khách hàng", flex: 1 },
                    { key: "warehouse.name", label: "Kho", flex: 1 },
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
                        key: "discountAmount",
                        label: "CK thường",
                        flex: 1,
                        render: (v: any) => <>{formatMoney(v)}</>,
                    },
                    {
                        key: "couponDiscountAmount",
                        label: "CK coupon",
                        flex: 1,
                        render: (v: any) => <>{formatMoney(v)}</>,
                    },
                    {
                        key: "surchargeAmount",
                        label: "Phụ phí",
                        flex: 1,
                        render: (v: any) => <>{formatMoney(v)}</>,
                    },
                    {
                        key: "status",
                        label: "Trạng thái",
                        width: 110,
                        render: (v: any) => <StatusBadge status={v || "—"} />,
                    },
                    { key: "paymentMethod", label: "Thanh toán", width: 100 },
                    {
                        key: "netAmount",
                        label: "Tổng tiền",
                        flex: 1,
                        render: (v: any) => <>{formatMoney(v)}</>,
                    },
                    { key: "createdBy.fullName", label: "Nhân viên", flex: 1 },
                    { key: "note", label: "Ghi chú", flex: 1.5 },
                ]}
            />

            <Modal
                visible={detailVisible}
                transparent
                animationType="fade"
                onRequestClose={closeDetail}
            >
                <View style={styles.overlay}>
                    <View style={styles.modalBox}>
                        <View style={styles.headerRow}>
                            <Text style={styles.title}>Chi tiết đơn hàng</Text>
                            <TouchableOpacity onPress={closeDetail}>
                                <Feather
                                    name="x"
                                    size={18}
                                    color={theme.colors.mutedForeground}
                                />
                            </TouchableOpacity>
                        </View>

                        {detailLoading ? (
                            <View style={styles.loadingWrap}>
                                <ActivityIndicator
                                    size="small"
                                    color={theme.colors.primary}
                                />
                                <Text style={styles.loadingText}>
                                    Đang tải chi tiết...
                                </Text>
                            </View>
                        ) : (
                            <>
                                <View style={styles.infoBlock}>
                                    {orderInfo.map((it) => (
                                        <View
                                            key={it.label}
                                            style={styles.infoRow}
                                        >
                                            <Text style={styles.infoLabel}>
                                                {it.label}
                                            </Text>
                                            <Text style={styles.infoValue}>
                                                {it.value}
                                            </Text>
                                        </View>
                                    ))}
                                </View>

                                <Text style={styles.sectionTitle}>
                                    Chi tiết dòng hàng
                                </Text>
                                <View style={styles.itemTableHeader}>
                                    <Text
                                        style={[
                                            styles.itemHeaderCell,
                                            { flex: 2 },
                                        ]}
                                    >
                                        Sản phẩm
                                    </Text>
                                    <Text
                                        style={[
                                            styles.itemHeaderCell,
                                            { flex: 1.2 },
                                        ]}
                                    >
                                        Đơn giá
                                    </Text>
                                    <Text
                                        style={[
                                            styles.itemHeaderCell,
                                            { flex: 0.7 },
                                        ]}
                                    >
                                        SL
                                    </Text>
                                    <Text
                                        style={[
                                            styles.itemHeaderCell,
                                            { flex: 1.2 },
                                        ]}
                                    >
                                        Thành tiền
                                    </Text>
                                </View>
                                {orderItems.length === 0 ? (
                                    <Text style={styles.emptyItems}>
                                        Không có dòng hàng.
                                    </Text>
                                ) : (
                                    <View style={styles.itemsWrap}>
                                        {orderItems.map((item) => (
                                            <View
                                                key={item.id}
                                                style={styles.itemRow}
                                            >
                                                <Text
                                                    style={[
                                                        styles.itemCell,
                                                        { flex: 2 },
                                                    ]}
                                                    numberOfLines={1}
                                                >
                                                    {item.product?.name || "-"}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.itemCell,
                                                        { flex: 1.2 },
                                                    ]}
                                                >
                                                    {formatMoney(
                                                        item.salePrice,
                                                    )}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.itemCell,
                                                        { flex: 0.7 },
                                                    ]}
                                                >
                                                    {item.qty || 0}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.itemCell,
                                                        { flex: 1.2 },
                                                    ]}
                                                >
                                                    {formatMoney(
                                                        item.lineRevenue,
                                                    )}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </>
    );
};

export default OrderListScreen;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: theme.colors.overlay,
        justifyContent: "center",
        paddingHorizontal: theme.spacing.md,
    },
    modalBox: {
        maxHeight: "85%",
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.md,
        gap: 10,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    title: {
        ...theme.typography.title,
        color: theme.colors.foreground,
    },
    loadingWrap: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 12,
    },
    loadingText: {
        color: theme.colors.mutedForeground,
        fontSize: 13,
    },
    infoBlock: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        overflow: "hidden",
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    infoLabel: {
        fontSize: 12,
        color: theme.colors.mutedForeground,
        fontWeight: "600",
    },
    infoValue: {
        flex: 1,
        fontSize: 13,
        color: theme.colors.foreground,
        textAlign: "right",
    },
    sectionTitle: {
        ...theme.typography.label,
        color: theme.colors.foreground,
        marginTop: 4,
    },
    itemTableHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 7,
        paddingHorizontal: 8,
        backgroundColor: theme.colors.surfaceRaised,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.sm,
    },
    itemHeaderCell: {
        fontSize: 11,
        fontWeight: "700",
        color: theme.colors.mutedForeground,
    },
    itemsWrap: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.sm,
        overflow: "hidden",
    },
    itemRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    itemCell: {
        fontSize: 12,
        color: theme.colors.foreground,
    },
    emptyItems: {
        fontSize: 12,
        color: theme.colors.mutedForeground,
        paddingVertical: 8,
    },
});
