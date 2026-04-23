import React, { useEffect } from "react";
import { View, Modal, StyleSheet, TouchableOpacity, Image, Linking, Alert } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Typography } from "../../../components/ui/Typography";
import { useTheme } from "../../../hooks/useTheme";
import { paymentApi } from "../../../api/paymentApi";

interface QRPaymentModalProps {
    visible: boolean;
    qrData: any;
    pendingOrderId: number | null;
    pendingOrderNo: string;
    pendingAmount: number;
    initialTimeLeftSec: number;
    onClose: () => void;
    onSuccess: (orderId: number) => void;
    onCancel: (orderId: number) => void;
    onError?: (error: any) => void;
    onChangeMethodToCash?: (orderId: number) => void;
}

export const QRPaymentModal: React.FC<QRPaymentModalProps> = ({
    visible,
    qrData,
    pendingOrderId,
    pendingOrderNo,
    pendingAmount,
    initialTimeLeftSec,
    onClose,
    onSuccess,
    onCancel,
    onError,
    onChangeMethodToCash
}) => {
    const { colors, metrics } = useTheme();
    const [timeLeftSec, setTimeLeftSec] = React.useState(initialTimeLeftSec);
    const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);

    // Sync initial time when modal becomes visible
    useEffect(() => {
        if (visible) {
            setTimeLeftSec(initialTimeLeftSec);
            setShowCancelConfirm(false);
        }
    }, [visible, initialTimeLeftSec]);

    useEffect(() => {
        if (!visible || !pendingOrderId) return;

        const poller = setInterval(async () => {
            try {
                const res = await paymentApi.checkPaymentStatus(pendingOrderId);
                if (!res.success) return;
                
                const { orderStatus } = res;
                if (orderStatus === "POSTED") {
                    clearInterval(poller);
                    clearInterval(countdown);
                    onSuccess(pendingOrderId);
                } else if (orderStatus === "CANCELLED") {
                    clearInterval(poller);
                    clearInterval(countdown);
                    onCancel(pendingOrderId);
                }
            } catch (e) {
                console.log("Lỗi check payment:", e);
            }
        }, 3000);

        const countdown = setInterval(() => {
            setTimeLeftSec((prev) => {
                if (prev <= 1) {
                    clearInterval(poller);
                    clearInterval(countdown);
                    
                    const orderIdToCancel = pendingOrderId;
                    (async () => {
                        try {
                            if (orderIdToCancel) await paymentApi.cancelOrder(orderIdToCancel);
                        } catch (e) {
                            console.log("Lỗi auto-cancel:", e);
                        }
                        onCancel(orderIdToCancel);
                    })();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(poller);
            clearInterval(countdown);
        };
    }, [visible, pendingOrderId]);

    const handleConfirmCancel = async () => {
        setShowCancelConfirm(false);
        if (!pendingOrderId) return;
        
        try {
            await paymentApi.cancelOrder(pendingOrderId);
            onCancel(pendingOrderId);
        } catch (e: any) {
            if (onError) {
                onError(e);
            } else {
                Alert.alert("Lỗi", e?.response?.data?.message || e?.message || "Không thể hủy đơn");
            }
        }
    };

    const minutes = Math.floor(timeLeftSec / 60).toString().padStart(2, "0");
    const seconds = (timeLeftSec % 60).toString().padStart(2, "0");

    const buildQrImageUri = () => {
        const rawQr = (qrData?.qrCode || "").trim();
        if (rawQr) {
            if (rawQr.startsWith("data:image") || rawQr.startsWith("http://") || rawQr.startsWith("https://")) {
                return rawQr;
            }
            return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(rawQr)}`;
        }
        const checkout = (qrData?.checkoutUrl || "").trim();
        if (checkout) {
            return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(checkout)}`;
        }
        return "";
    };

    const qrImageUri = buildQrImageUri();

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
                    <View style={styles.modalHeader}>
                        <MaterialCommunityIcons name="qrcode-scan" size={28} color={colors.primary} />
                        <Typography variant="heading2" color={colors.textPrimary}>Thanh Toán QR</Typography>
                    </View>

                    <Typography variant="body" color={colors.textSecondary} style={{ marginBottom: 8 }}>
                        Đơn #{pendingOrderNo}
                    </Typography>
                    <Typography variant="heading2" color={colors.primary} style={{ marginBottom: 12 }}>
                        {pendingAmount.toLocaleString("vi-VN")} đ
                    </Typography>

                    <View style={[styles.qrWrap, { borderColor: colors.border }]}>
                        {!!qrImageUri ? (
                            <Image source={{ uri: qrImageUri }} style={styles.qrImage} resizeMode="contain" />
                        ) : (
                            <Typography variant="body" color={colors.textSecondary}>Không có dữ liệu QR hợp lệ</Typography>
                        )}
                    </View>

                    <Typography variant="caption" color={colors.textSecondary} style={{ marginTop: 12, textAlign: "center" }}>
                        Thời gian còn lại: {minutes}:{seconds}
                    </Typography>

                    {!!qrData?.checkoutUrl && (
                        <TouchableOpacity
                            style={[styles.modalConfirmBtn, { backgroundColor: colors.primary, borderRadius: metrics.borderRadius.medium, marginTop: 12 }]}
                            onPress={() => Linking.openURL(qrData.checkoutUrl as string)}
                        >
                            <Typography variant="bodyEmphasized" color={colors.buttonText}>Mở Trang Thanh Toán</Typography>
                        </TouchableOpacity>
                    )}

                    {onChangeMethodToCash && pendingOrderId && (
                        <TouchableOpacity
                            style={[styles.modalConfirmBtn, { backgroundColor: colors.primary, borderRadius: metrics.borderRadius.medium, marginTop: 12 }]}
                            onPress={async () => {
                                try {
                                    await paymentApi.changePaymentMethod(pendingOrderId, "CASH");
                                    onChangeMethodToCash(pendingOrderId);
                                } catch (e: any) {
                                    Alert.alert("Lỗi", "Không thể đổi phương thức: " + (e?.response?.data?.message || e?.message || e));
                                }
                            }}
                        >
                            <Typography variant="bodyEmphasized" color={colors.buttonText}>Đổi sang tiền mặt</Typography>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.modalCloseBtn, { borderColor: colors.danger, borderRadius: metrics.borderRadius.medium, marginTop: 12 }]}
                        onPress={() => setShowCancelConfirm(true)}
                    >
                        <Typography variant="bodyEmphasized" color={colors.danger}>Hủy đơn</Typography>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.modalCloseBtn, { borderColor: colors.border, borderRadius: metrics.borderRadius.medium }]}
                        onPress={onClose}
                    >
                        <Typography variant="bodyEmphasized" color={colors.textPrimary}>Ẩn QR</Typography>
                    </TouchableOpacity>
                </View>
            </View>

            {showCancelConfirm && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" }]}>
                    <View style={[styles.modalBox, { backgroundColor: colors.surface, maxWidth: 360 }]}>
                        <Typography variant="heading2" color={colors.textPrimary} style={{ marginBottom: 8 }}>
                            Xác nhận hủy đơn
                        </Typography>
                        <Typography variant="body" color={colors.textSecondary} style={{ marginBottom: 24 }}>
                            Bạn có chắc muốn hủy đơn #{pendingOrderNo}? Thao tác này không thể hoàn tác.
                        </Typography>
                        <View style={{ flexDirection: "row", gap: 12 }}>
                            <TouchableOpacity
                                style={{ flex: 1, padding: 12, alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 8 }}
                                onPress={() => setShowCancelConfirm(false)}
                            >
                                <Typography variant="bodyEmphasized" color={colors.textPrimary}>Không</Typography>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 1, padding: 12, alignItems: "center", backgroundColor: colors.danger, borderRadius: 8 }}
                                onPress={handleConfirmCancel}
                            >
                                <Typography variant="bodyEmphasized" color="#fff">Hủy đơn</Typography>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
    modalBox: { borderRadius: 16, padding: 24, width: "90%", maxWidth: 480, elevation: 10 },
    modalHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
    modalConfirmBtn: { padding: 12, alignItems: "center" },
    modalCloseBtn: { padding: 12, alignItems: "center", borderWidth: 1, marginTop: 8 },
    qrWrap: { borderWidth: 1, borderRadius: 12, padding: 12, alignItems: "center", justifyContent: "center" },
    qrImage: { width: 260, height: 260 }
});
