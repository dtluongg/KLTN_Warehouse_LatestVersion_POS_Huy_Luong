import React from 'react';
import DataTableScreen, { formatMoney } from '../components/DataTableScreen';

const ProductListScreen = () => (
  <DataTableScreen
    apiUrl="/products"
    searchPlaceholder="Tìm theo SKU, tên sản phẩm..."
    columns={[
      { key: 'sku', label: 'SKU', width: 120 },
      { key: 'name', label: 'Tên sản phẩm', flex: 2 },
      { key: 'category.name', label: 'Danh mục', flex: 1 },
      { key: 'salePrice', label: 'Giá bán', flex: 1, render: (v: any) => <>{formatMoney(v)}</> },
      { key: 'avgCost', label: 'Giá vốn TB', flex: 1, render: (v: any) => <>{formatMoney(v)}</> },
      { key: 'onHand', label: 'Tồn kho', width: 80 },
    ]}
  />
);

export default ProductListScreen;
