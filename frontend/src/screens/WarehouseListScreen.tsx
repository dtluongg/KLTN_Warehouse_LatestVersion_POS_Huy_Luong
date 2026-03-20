import React from 'react';
import DataTableScreen, { StatusBadge } from '../components/DataTableScreen';

const WarehouseListScreen = () => (
  <DataTableScreen
    apiUrl="/warehouses"
    searchPlaceholder="Tìm mã, tên kho..."
    columns={[
      { key: 'code', label: 'Mã kho', width: 120 },
      { key: 'name', label: 'Tên kho', flex: 2 },
      { key: 'address', label: 'Địa chỉ', flex: 2 },
      {
        key: 'isActive', label: 'Trạng thái', width: 100,
        render: (v: any) => <StatusBadge status={v ? 'ACTIVE' : 'INACTIVE'} />,
      },
    ]}
  />
);

export default WarehouseListScreen;
