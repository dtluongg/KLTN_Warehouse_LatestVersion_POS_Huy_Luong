import { Role } from "../types";

export type AppRole = Role;

const ROLE_VALUES = [Role.ADMIN, Role.SALES_STAFF, Role.WAREHOUSE_STAFF] as const;

export const ROLE_LABELS: Record<AppRole, string> = {
    [Role.ADMIN]: "Quản trị viên",
    [Role.SALES_STAFF]: "Bán hàng",
    [Role.WAREHOUSE_STAFF]: "Kho",
};

const SALES_ALLOWED_ROUTES = new Set<string>([
    "Overview",
    "Pos",
    "Orders",
    "Customers",
    "CustomerReturns",
    "CustomerReturnForm",
    "InventoryStock",
    "AiSqlChat",
]);

const WAREHOUSE_ALLOWED_ROUTES = new Set<string>([
    "Overview",
    "PurchaseOrders",
    "PurchaseOrderForm",
    "GoodsReceipt",
    "GoodsReceiptForm",
    "Suppliers",
    "SupplierReturns",
    "SupplierReturnForm",
    "InventoryStock",
    "StockAdjustments",
    "StockAdjustmentForm",
    "InventoryMovements",
    "WarehouseStatistics",
    "AiSqlChat",
]);

export function normalizeRole(role: string | null | undefined): AppRole | null {
    if (!role) {
        return null;
    }

    return ROLE_VALUES.includes(role as AppRole) ? (role as AppRole) : null;
}

export function getRoleLabel(role: string | null | undefined): string {
    const normalizedRole = normalizeRole(role);
    return normalizedRole ? ROLE_LABELS[normalizedRole] : "Nhân viên";
}

export function isRouteAllowedByRole(
    role: string | null | undefined,
    routeName: string,
): boolean {
    const normalizedRole = normalizeRole(role);

    if (!normalizedRole) {
        return false;
    }

    if (normalizedRole === "ADMIN") {
        return true;
    }

    if (normalizedRole === "SALES_STAFF") {
        return SALES_ALLOWED_ROUTES.has(routeName);
    }

    return WAREHOUSE_ALLOWED_ROUTES.has(routeName);
}
