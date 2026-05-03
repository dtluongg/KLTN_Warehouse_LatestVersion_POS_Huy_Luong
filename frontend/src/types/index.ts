export enum Role {
    ADMIN = "ADMIN",
    SALES_STAFF = "SALES_STAFF",
    WAREHOUSE_STAFF = "WAREHOUSE_STAFF",
}

export interface Staff {
    id: number;
    staffCode: string;
    fullName: string;
    username: string;
    role: Role;
    isActive: boolean;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string | null;
    tokenType: string;
    username: string;
    role: Role;
    accessTokenExpiresInMs: number;
    refreshTokenExpiresInMs: number;
}

export interface RefreshTokenRequest {
    refreshToken?: string | null;
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
