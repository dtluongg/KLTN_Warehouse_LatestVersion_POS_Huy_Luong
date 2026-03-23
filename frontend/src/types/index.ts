export interface Staff {
    id: number;
    staffCode: string;
    fullName: string;
    username: string;
    role: "ADMIN" | "SALES_STAFF" | "WAREHOUSE_STAFF";
    isActive: boolean;
}

export interface AuthResponse {
    token: string;
    username: string;
    role: string;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    isActive: boolean;
}

export interface Product {
    id: number;
    sku: string;
    barcode: string;
    name: string;
    shortName: string;
    category: Category;
    salePrice: number;
    avgCost: number;
    isActive: boolean;
}
