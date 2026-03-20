import React from 'react';
import DataTableScreen, { StatusBadge } from '../components/DataTableScreen';

const StaffListScreen = () => (
  <DataTableScreen
    apiUrl="/staffs"
    searchPlaceholder="Tìm mã, tên nhân viên..."
    columns={[
      { key: 'staffCode', label: 'Mã NV', width: 100 },
      { key: 'fullName', label: 'Họ tên', flex: 2 },
      { key: 'phone', label: 'SĐT', flex: 1 },
      { key: 'role', label: 'Vai trò', flex: 1 },
      {
        key: 'isActive', label: 'Trạng thái', width: 100,
        render: (v: any) => <StatusBadge status={v ? 'ACTIVE' : 'INACTIVE'} />,
      },
    ]}
  />
);

export default StaffListScreen;
