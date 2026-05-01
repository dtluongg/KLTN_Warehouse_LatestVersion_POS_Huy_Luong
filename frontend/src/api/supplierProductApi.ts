import { axiosClient } from './axiosClient';

// ─── Types ──────────────────────────────────────────────
export interface SupplierProductDTO {
    id: number;
    supplierId: string;
    supplierName: string;
    productId: number;
    productSku: string;
    productName: string;
    vatRate?: number;
    standardPrice: number;
    isActive: boolean;
    lastUpdatedAt: string | null;
    createdAt: string | null;
}

export interface SupplierProductRequest {
    supplierId: string;
    productId: number;
    standardPrice: number;
    isActive?: boolean;
}

// ─── API ────────────────────────────────────────────────

/** Lấy DS sản phẩm mà 1 NCC cung cấp (active) */
export const getProductsBySupplier = (supplierId: string) =>
    axiosClient.get<SupplierProductDTO[]>(`/supplier-products/by-supplier/${supplierId}`);

/** Lấy DS NCC cung cấp 1 SP (active) */
export const getSuppliersByProduct = (productId: number) =>
    axiosClient.get<SupplierProductDTO[]>(`/supplier-products/by-product/${productId}`);

/** Thêm SP vào bảng giá NCC */
export const createSupplierProduct = (data: SupplierProductRequest) =>
    axiosClient.post<SupplierProductDTO>('/supplier-products', data);

/** Cập nhật giá / trạng thái */
export const updateSupplierProduct = (id: number, data: SupplierProductRequest) =>
    axiosClient.put<SupplierProductDTO>(`/supplier-products/${id}`, data);

/** Xóa SP khỏi bảng giá NCC */
export const deleteSupplierProduct = (id: number) =>
    axiosClient.delete(`/supplier-products/${id}`);
