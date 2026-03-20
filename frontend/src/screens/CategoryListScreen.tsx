import React from 'react';
import { Text } from 'react-native';
import DataTableScreen, { StatusBadge } from '../components/DataTableScreen';

const CategoryListScreen = () => (
  <DataTableScreen
    apiUrl="/categories"
    searchPlaceholder="Tìm danh mục..."
    columns={[
      { key: 'id', label: 'ID', width: 60 },
      { key: 'name', label: 'Tên danh mục', flex: 2 },
      { key: 'slug', label: 'Slug', flex: 1 },
      {
        key: 'isActive', label: 'Trạng thái', width: 100,
        render: (v: any) => <StatusBadge status={v ? 'ACTIVE' : 'INACTIVE'} />,
      },
    ]}
  />
);

export default CategoryListScreen;
