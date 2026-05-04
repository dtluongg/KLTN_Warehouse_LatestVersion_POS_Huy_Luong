export const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount);
};

export const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN") + " " + date.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
};

const commonStyles = `
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1f2937; max-width: 800px; margin: 0 auto; line-height: 1.5; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
        .header h1 { margin: 0; font-size: 28px; color: #111827; text-transform: uppercase; letter-spacing: 1px; }
        .header p { margin: 5px 0; color: #4b5563; font-size: 14px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; }
        .info-item { margin-bottom: 8px; }
        .info-label { font-weight: 600; color: #4b5563; display: inline-block; width: 120px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; }
        th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
        th { background-color: #f3f4f6; font-weight: 600; color: #374151; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .total-section { width: 350px; margin-left: auto; background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #d1d5db; }
        .total-row:last-child { border-bottom: none; }
        .total-row.bold { font-weight: bold; font-size: 18px; border-bottom: none; border-top: 2px solid #9ca3af; padding-top: 12px; margin-top: 4px; color: #111827; }
        .footer { text-align: center; margin-top: 50px; font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        .signature-grid { display: grid; grid-template-columns: 1fr 1fr; text-align: center; margin-top: 40px; }
        .signature-title { font-weight: 600; margin-bottom: 60px; }
    </style>
`;

export const generateOrderReceiptHTML = (order: any) => {
    const itemsHtml = order?.items?.map((item: any, index: number) => `
        <tr>
            <td class="text-center">${index + 1}</td>
            <td>${item.productSku || '-'}</td>
            <td><strong>${item.productShortName || item.productName || '-'}</strong></td>
            <td class="text-right">${item.qty}</td>
            <td class="text-right">${formatCurrency(item.salePrice)}</td>
            <td class="text-right">${formatCurrency(item.lineRevenue)}</td>
        </tr>
    `).join('') || '<tr><td colspan="6" class="text-center">Không có sản phẩm</td></tr>';

    return `
        <html>
            <head>
                <meta charset="utf-8">
                ${commonStyles}
            </head>
            <body>
                <div class="header">
                    <h1>HÓA ĐƠN BÁN HÀNG</h1>
                    <p>Mã hóa đơn: <strong>${order?.orderNo || '-'}</strong></p>
                    <p>Ngày lập: ${formatDate(order?.orderTime || order?.createdAt)}</p>
                </div>

                <div class="info-grid">
                    <div>
                        <div class="info-item"><span class="info-label">Khách hàng:</span> ${order?.customerName || 'Khách lẻ'}</div>
                        <div class="info-item"><span class="info-label">Số điện thoại:</span> ${order?.customerPhone || '-'}</div>
                        <div class="info-item"><span class="info-label">Kênh bán:</span> ${order?.salesChannel || '-'}</div>
                    </div>
                    <div>
                        <div class="info-item"><span class="info-label">Kho hàng:</span> ${order?.warehouseName || '-'}</div>
                        <div class="info-item"><span class="info-label">Nhân viên lập:</span> ${order?.createdBy || '-'}</div>
                        <div class="info-item"><span class="info-label">Trạng thái:</span> ${order?.status || '-'}</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th width="5%">STT</th>
                            <th width="15%">Mã SP</th>
                            <th width="35%">Tên sản phẩm</th>
                            <th width="10%" class="text-right">SL</th>
                            <th width="15%" class="text-right">Đơn giá</th>
                            <th width="20%" class="text-right">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div class="total-section">
                    <div class="total-row">
                        <span>Tổng tiền hàng:</span>
                        <span>${formatCurrency(order?.grossAmount)}</span>
                    </div>
                    <div class="total-row">
                        <span>Chiết khấu:</span>
                        <span>- ${formatCurrency(order?.discountAmount)}</span>
                    </div>
                    ${order?.couponDiscountAmount > 0 ? `
                    <div class="total-row">
                        <span>Voucher (${order?.couponCode}):</span>
                        <span>- ${formatCurrency(order?.couponDiscountAmount)}</span>
                    </div>` : ''}
                    <div class="total-row">
                        <span>Phụ phí:</span>
                        <span>+ ${formatCurrency(order?.surchargeAmount)}</span>
                    </div>
                    <div class="total-row bold">
                        <span>TỔNG CỘNG:</span>
                        <span>${formatCurrency(order?.netAmount)}</span>
                    </div>
                </div>

                <div class="signature-grid">
                    <div>
                        <div class="signature-title">Người mua hàng</div>
                        <div>(Ký, ghi rõ họ tên)</div>
                    </div>
                    <div>
                        <div class="signature-title">Người lập phiếu</div>
                        <div>(Ký, ghi rõ họ tên)</div>
                    </div>
                </div>

                <div class="footer">
                    <p>Cảm ơn quý khách đã mua hàng!</p>
                    <p>Hóa đơn được in từ phần mềm quản lý kho & bán hàng.</p>
                </div>
            </body>
        </html>
    `;
};

export const generatePurchaseOrderHTML = (po: any) => {
    const itemsHtml = po?.items?.map((item: any, index: number) => `
        <tr>
            <td class="text-center">${index + 1}</td>
            <td>${item.productSku || '-'}</td>
            <td>${item.productName || '-'}</td>
            <td class="text-right">${item.orderedQty || 0}</td>
            <td class="text-right">${formatCurrency(item.expectedUnitCost)}</td>
            <td class="text-right">${formatCurrency(item.lineTotal)}</td>
        </tr>
    `).join('') || '<tr><td colspan="6" class="text-center">Không có sản phẩm</td></tr>';

    return `
        <html>
            <head>
                <meta charset="utf-8">
                ${commonStyles}
            </head>
            <body>
                <div class="header">
                    <h1>ĐƠN ĐẶT HÀNG (PO)</h1>
                    <p>Mã đơn: <strong>${po?.poNo || '-'}</strong></p>
                    <p>Ngày lập: ${formatDate(po?.orderDate || po?.createdAt)}</p>
                </div>

                <div class="info-grid">
                    <div>
                        <div class="info-item"><span class="info-label">Nhà cung cấp:</span> ${po?.supplierName || '-'}</div>
                        <div class="info-item"><span class="info-label">Ngày dự kiến:</span> ${formatDate(po?.expectedDate) || '-'}</div>
                        <div class="info-item"><span class="info-label">Trạng thái:</span> ${po?.status || '-'}</div>
                    </div>
                    <div>
                        <div class="info-item"><span class="info-label">Kho nhận:</span> ${po?.warehouseName || '-'}</div>
                        <div class="info-item"><span class="info-label">Tiến độ nhận:</span> ${po?.receiptProgress || '-'}</div>
                        <div class="info-item"><span class="info-label">Người lập:</span> ${po?.createdBy || '-'}</div>
                    </div>
                </div>
                ${po?.note ? `<div style="margin-bottom: 20px;"><strong>Ghi chú:</strong> ${po.note}</div>` : ''}

                <table>
                    <thead>
                        <tr>
                            <th width="5%">STT</th>
                            <th width="15%">Mã SP</th>
                            <th width="40%">Tên sản phẩm</th>
                            <th width="10%" class="text-right">SL Đặt</th>
                            <th width="15%" class="text-right">Đơn giá</th>
                            <th width="15%" class="text-right">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div class="total-section">
                    <div class="total-row">
                        <span>Tổng tiền hàng:</span>
                        <span>${formatCurrency(po?.totalAmount)}</span>
                    </div>
                    <div class="total-row">
                        <span>Tổng thuế VAT:</span>
                        <span>+ ${formatCurrency(po?.totalVat)}</span>
                    </div>
                    <div class="total-row">
                        <span>Chiết khấu:</span>
                        <span>- ${formatCurrency(po?.discountAmount)}</span>
                    </div>
                    <div class="total-row">
                        <span>Phụ phí:</span>
                        <span>+ ${formatCurrency(po?.surchargeAmount)}</span>
                    </div>
                    <div class="total-row bold">
                        <span>TỔNG CẦN TRẢ:</span>
                        <span>${formatCurrency(po?.totalAmountPayable)}</span>
                    </div>
                </div>

                <div class="signature-grid">
                    <div>
                        <div class="signature-title">Đại diện Nhà Cung Cấp</div>
                        <div>(Ký, ghi rõ họ tên)</div>
                    </div>
                    <div>
                        <div class="signature-title">Người lập phiếu</div>
                        <div>(Ký, ghi rõ họ tên)</div>
                    </div>
                </div>
            </body>
        </html>
    `;
};

export const generateGoodsReceiptHTML = (gr: any) => {
    const itemsHtml = gr?.items?.map((item: any, index: number) => `
        <tr>
            <td class="text-center">${index + 1}</td>
            <td>${item.productSku || '-'}</td>
            <td>${item.productName || '-'}</td>
            <td class="text-right">${item.receivedQty || 0}</td>
            <td class="text-right">${formatCurrency(item.actualUnitCost)}</td>
            <td class="text-right">${formatCurrency(item.lineTotal)}</td>
        </tr>
    `).join('') || '<tr><td colspan="6" class="text-center">Không có sản phẩm</td></tr>';

    return `
        <html>
            <head>
                <meta charset="utf-8">
                ${commonStyles}
            </head>
            <body>
                <div class="header">
                    <h1>PHIẾU NHẬP KHO (GR)</h1>
                    <p>Mã phiếu: <strong>${gr?.grNo || '-'}</strong></p>
                    <p>Ngày lập: ${formatDate(gr?.createdAt)}</p>
                </div>

                <div class="info-grid">
                    <div>
                        <div class="info-item"><span class="info-label">Nhà cung cấp:</span> ${gr?.supplierName || '-'}</div>
                        <div class="info-item"><span class="info-label">Thuộc PO:</span> ${gr?.poNo || '-'}</div>
                        <div class="info-item"><span class="info-label">Trạng thái:</span> ${gr?.status || '-'}</div>
                    </div>
                    <div>
                        <div class="info-item"><span class="info-label">Kho hàng:</span> ${gr?.warehouseName || '-'}</div>
                        <div class="info-item"><span class="info-label">Người nhập:</span> ${gr?.receivedBy || gr?.createdBy || '-'}</div>
                        <div class="info-item"><span class="info-label">Ngày nhập:</span> ${formatDate(gr?.receiptDate) || '-'}</div>
                    </div>
                </div>
                ${gr?.note ? `<div style="margin-bottom: 20px;"><strong>Ghi chú:</strong> ${gr.note}</div>` : ''}

                <table>
                    <thead>
                        <tr>
                            <th width="5%">STT</th>
                            <th width="15%">Mã SP</th>
                            <th width="40%">Tên sản phẩm</th>
                            <th width="10%" class="text-right">SL Nhận</th>
                            <th width="15%" class="text-right">Đơn giá</th>
                            <th width="15%" class="text-right">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div class="total-section">
                    <div class="total-row">
                        <span>Tổng tiền hàng:</span>
                        <span>${formatCurrency(gr?.totalAmount)}</span>
                    </div>
                    <div class="total-row">
                        <span>Chiết khấu:</span>
                        <span>- ${formatCurrency(gr?.discountAmount)}</span>
                    </div>
                    <div class="total-row">
                        <span>Phụ phí:</span>
                        <span>+ ${formatCurrency(gr?.surchargeAmount)}</span>
                    </div>
                    <div class="total-row bold">
                        <span>TỔNG CẦN TRẢ:</span>
                        <span>${formatCurrency(gr?.totalAmountPayable)}</span>
                    </div>
                </div>

                <div class="signature-grid">
                    <div>
                        <div class="signature-title">Người giao hàng</div>
                        <div>(Ký, ghi rõ họ tên)</div>
                    </div>
                    <div>
                        <div class="signature-title">Người nhận (Thủ kho)</div>
                        <div>(Ký, ghi rõ họ tên)</div>
                    </div>
                </div>
            </body>
        </html>
    `;
};

export const generateCustomerReturnHTML = (ret: any) => {
    const itemsHtml = ret?.items?.map((item: any, index: number) => `
        <tr>
            <td class="text-center">${index + 1}</td>
            <td>${item.productSku || '-'}</td>
            <td>${item.productName || '-'}</td>
            <td class="text-center">${item.returnReason || '-'}</td>
            <td class="text-right">${item.qty || 0}</td>
            <td class="text-right">${formatCurrency(item.refundPrice)}</td>
            <td class="text-right">${formatCurrency(item.lineRefund)}</td>
        </tr>
    `).join('') || '<tr><td colspan="7" class="text-center">Không có sản phẩm</td></tr>';

    return `
        <html>
            <head>
                <meta charset="utf-8">
                ${commonStyles}
            </head>
            <body>
                <div class="header">
                    <h1>PHIẾU TRẢ HÀNG CỦA KHÁCH</h1>
                    <p>Mã phiếu: <strong>${ret?.returnNo || '-'}</strong></p>
                    <p>Ngày lập: ${formatDate(ret?.returnDate || ret?.createdAt)}</p>
                </div>

                <div class="info-grid">
                    <div>
                        <div class="info-item"><span class="info-label">Khách hàng:</span> ${ret?.customerName || '-'}</div>
                        <div class="info-item"><span class="info-label">Từ hóa đơn:</span> ${ret?.orderNo || '-'}</div>
                    </div>
                    <div>
                        <div class="info-item"><span class="info-label">Kho nhập:</span> ${ret?.warehouseName || '-'}</div>
                        <div class="info-item"><span class="info-label">Người lập:</span> ${ret?.createdBy || '-'}</div>
                    </div>
                </div>
                ${ret?.note ? `<div style="margin-bottom: 20px;"><strong>Ghi chú:</strong> ${ret.note}</div>` : ''}

                <table>
                    <thead>
                        <tr>
                            <th width="5%">STT</th>
                            <th width="15%">Mã SP</th>
                            <th width="25%">Tên sản phẩm</th>
                            <th width="20%" class="text-center">Lý do</th>
                            <th width="10%" class="text-right">SL Trả</th>
                            <th width="10%" class="text-right">Đơn giá</th>
                            <th width="15%" class="text-right">Hoàn tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div class="total-section">
                    <div class="total-row bold">
                        <span>TỔNG TIỀN HOÀN TRẢ:</span>
                        <span>${formatCurrency(ret?.totalRefundAmount)}</span>
                    </div>
                </div>

                <div class="signature-grid">
                    <div>
                        <div class="signature-title">Khách hàng</div>
                        <div>(Ký, ghi rõ họ tên)</div>
                    </div>
                    <div>
                        <div class="signature-title">Người lập phiếu</div>
                        <div>(Ký, ghi rõ họ tên)</div>
                    </div>
                </div>
            </body>
        </html>
    `;
};

export const generateStockAdjustmentHTML = (adj: any) => {
    const itemsHtml = adj?.items?.map((item: any, index: number) => `
        <tr>
            <td class="text-center">${index + 1}</td>
            <td>${item.productSku || '-'}</td>
            <td>${item.productName || '-'}</td>
            <td class="text-right">${item.systemQty || 0}</td>
            <td class="text-right">${item.actualQty || 0}</td>
            <td class="text-right" style="color: ${item.differenceQty > 0 ? '#059669' : (item.differenceQty < 0 ? '#dc2626' : '#374151')}">
                <strong>${item.differenceQty > 0 ? '+' : ''}${item.differenceQty || 0}</strong>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="6" class="text-center">Không có sản phẩm</td></tr>';

    return `
        <html>
            <head>
                <meta charset="utf-8">
                ${commonStyles}
            </head>
            <body>
                <div class="header">
                    <h1>PHIẾU KIỂM KHO</h1>
                    <p>Mã phiếu: <strong>${adj?.adjustmentNo || '-'}</strong></p>
                    <p>Ngày lập: ${formatDate(adj?.adjustmentDate || adj?.createdAt)}</p>
                </div>

                <div class="info-grid">
                    <div>
                        <div class="info-item"><span class="info-label">Kho hàng:</span> ${adj?.warehouseName || '-'}</div>
                        <div class="info-item"><span class="info-label">Trạng thái:</span> ${adj?.status || '-'}</div>
                    </div>
                    <div>
                        <div class="info-item"><span class="info-label">Người lập:</span> ${adj?.createdBy || '-'}</div>
                    </div>
                </div>
                ${adj?.note ? `<div style="margin-bottom: 20px;"><strong>Ghi chú:</strong> ${adj.note}</div>` : ''}

                <table>
                    <thead>
                        <tr>
                            <th width="5%">STT</th>
                            <th width="15%">Mã SP</th>
                            <th width="40%">Tên sản phẩm</th>
                            <th width="10%" class="text-right">SL HT</th>
                            <th width="10%" class="text-right">SL Thực</th>
                            <th width="20%" class="text-right">Chênh lệch</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div class="signature-grid">
                    <div>
                        <div class="signature-title">Người kiểm tra</div>
                        <div>(Ký, ghi rõ họ tên)</div>
                    </div>
                    <div>
                        <div class="signature-title">Quản lý kho</div>
                        <div>(Ký, ghi rõ họ tên)</div>
                    </div>
                </div>
            </body>
        </html>
    `;
};
