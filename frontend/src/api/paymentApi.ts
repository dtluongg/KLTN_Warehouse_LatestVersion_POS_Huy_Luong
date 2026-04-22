import { axiosClient } from "./axiosClient";

export type CreateQrData = {
    orderCode: string;
    amount: string;
    description?: string;
    checkoutUrl?: string;
    qrCode?: string;
    status?: string;
    expireDate?: string;
};

export const paymentApi = {
    async createQr(orderId: number) {
        const res = await axiosClient.post<{ success: boolean; message?: string; data: CreateQrData }>(
            `/payments/create-qr/${orderId}`,
        );
        return res.data;
    },

    async changePaymentMethod(orderId: number, paymentMethod: string) {
        const res = await axiosClient.post(`/orders/${orderId}/change-payment-method?paymentMethod=${paymentMethod}`);
        return res.data;
    },

    async cancelOrder(orderId: number) {
        const res = await axiosClient.post(`/orders/${orderId}/cancel`);
        return res.data;
    },

    async reopenQr(orderId: number) {
        const res = await axiosClient.post(`/orders/${orderId}/reopen-qr`);
        return res.data;
    },

    async checkPaymentStatus(orderId: number) {
    const res = await axiosClient.get<{
        success: boolean;
        payosStatus: string;
        orderStatus: string;
    }>(`/payments/check/${orderId}`);

    return res.data;
}
};
