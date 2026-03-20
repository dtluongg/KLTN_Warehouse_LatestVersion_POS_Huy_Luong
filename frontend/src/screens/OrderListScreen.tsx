import React from 'react';
import DataTableScreen, { StatusBadge, formatMoney } from '../components/DataTableScreen';

const OrderListScreen = () => (
  <DataTableScreen
    apiUrl="/orders"
    searchPlaceholder="Tìm mã đơn hàng..."
    columns={[
      { key: 'orderNo', label: 'Mã đơn', width: 130 },
      { key: 'salesChannel', label: 'Kênh', width: 80 },
      { key: 'customer.name', label: 'Khách hàng', flex: 1 },
      { key: 'warehouse.name', label: 'Kho', flex: 1 },
      { key: 'orderTime', label: 'Ngày', flex: 1, render: (v: any) => <>{v ? new Date(v).toLocaleDateString('vi-VN') : '—'}</> },
      { key: 'status', label: 'Trạng thái', width: 110, render: (v: any) => <StatusBadge status={v || '—'} /> },
      { key: 'netAmount', label: 'Tổng tiền', flex: 1, render: (v: any) => <>{formatMoney(v)}</> },
    ]}
  />
);

export default OrderListScreen;
