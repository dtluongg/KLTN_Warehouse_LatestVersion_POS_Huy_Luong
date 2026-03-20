import React from 'react';
import DataTableScreen, { StatusBadge, formatMoney } from '../components/DataTableScreen';

const SupplierReturnListScreen = () => (
  <DataTableScreen
    apiUrl="/supplier-returns"
    searchPlaceholder="Tìm mã phiếu trả hàng NCC..."
    columns={[
      { key: 'returnNo', label: 'Mã phiếu', width: 130 },
      { key: 'supplier.name', label: 'Nhà cung cấp', flex: 1.5 },
      { key: 'warehouse.name', label: 'Kho', flex: 1 },
      { key: 'returnDate', label: 'Ngày trả', flex: 1 },
      { key: 'status', label: 'Trạng thái', width: 110, render: (v: any) => <StatusBadge status={v || '—'} /> },
      { key: 'totalAmountPayable', label: 'Tổng tiền', flex: 1, render: (v: any) => <>{formatMoney(v)}</> },
    ]}
  />
);

export default SupplierReturnListScreen;
