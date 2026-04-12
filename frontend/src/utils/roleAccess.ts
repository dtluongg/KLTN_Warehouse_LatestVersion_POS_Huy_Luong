export type AppRole = "ADMIN" | "SALES_STAFF" | "WAREHOUSE_STAFF";

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
    "AiSqlChat",
]);

export function normalizeRole(role: string | null | undefined): AppRole | null {
    if (role === "ADMIN" || role === "SALES_STAFF" || role === "WAREHOUSE_STAFF") {
        return role;
    }
    return null;
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
