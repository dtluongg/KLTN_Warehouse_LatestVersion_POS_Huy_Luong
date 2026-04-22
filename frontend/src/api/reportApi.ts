import { axiosClient } from "./axiosClient";

export type InventoryValueRow = {
    warehouseId: number;
    warehouseName: string;
    productId: number;
    sku: string;
    productName: string;
    onHand: number;
    avgCost: number;
    totalValue: number;
    category?: string;
};

export type DaysOfCoverageRow = {
    warehouseId: number;
    warehouseName: string;
    productId: number;
    sku: string;
    productName: string;
    onHand: number;
    avgDailyDemand: number;
    daysOfCoverage: number;
    riskLevel: "CRITICAL" | "WARNING" | "SAFE";
};

export type StockoutRiskRow = {
    warehouseId: number;
    warehouseName: string;
    productId: number;
    sku: string;
    productName: string;
    onHand: number;
    avgDailyDemand: number;
    daysUntilStockout: number;
    estimatedStockoutDate?: string;
    priority: "CRITICAL" | "HIGH" | "MEDIUM" | "SAFE";
};

export type SlowMovingRow = {
    warehouseId: number;
    warehouseName: string;
    productId: number;
    sku: string;
    productName: string;
    onHand: number;
    inventoryValue: number;
    daysSinceLastMovement: number;
    lastMovementDate?: string;
    riskCategory: "DEAD_STOCK" | "SLOW_MOVING" | "NORMAL";
};

export type InventoryDetailRow = {
    warehouseId: number;
    productId: number;
    sku: string;
    productName: string;
    categoryName?: string;
    onHand: number;
    avgCost: number;
    salePrice: number;
    totalValue: number;
    status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
};

export type InventoryTurnoverRow = {
    warehouseId: number;
    productId: number;
    sku: string;
    productName: string;
    quantitySold: number;
    revenue: number;
    cogs: number;
    avgInventoryQty: number;
    avgInventoryValue: number;
    turnoverRatio: number;
    daysInventoryOutstanding: number;
};

export const reportApi = {
    async getInventoryValue(warehouseId: number) {
        const res = await axiosClient.get<InventoryValueRow[]>("/reports/inventory-value", {
            params: { warehouseId },
        });
        return res.data || [];
    },

    async getDaysOfCoverage(warehouseId: number, analysisDays = 30) {
        const res = await axiosClient.get<DaysOfCoverageRow[]>("/reports/days-of-coverage", {
            params: { warehouseId, analysisDays },
        });
        return res.data || [];
    },

    async getStockoutRisk(warehouseId: number, analysisDays = 30) {
        const res = await axiosClient.get<StockoutRiskRow[]>("/reports/stockout-risk", {
            params: { warehouseId, analysisDays },
        });
        return res.data || [];
    },

    async getSlowMovingProducts(warehouseId: number, inactiveDays = 30) {
        const res = await axiosClient.get<SlowMovingRow[]>("/reports/slow-moving-products", {
            params: { warehouseId, inactiveDays },
        });
        return res.data || [];
    },

    async getInventoryDetail(warehouseId: number) {
        const res = await axiosClient.get<InventoryDetailRow[]>("/reports/inventory-detail", {
            params: { warehouseId },
        });
        return res.data || [];
    },

    async getInventoryTurnover(warehouseId: number, fromDate: string, toDate: string) {
        const res = await axiosClient.get<InventoryTurnoverRow[]>("/reports/inventory-turnover", {
            params: { warehouseId, fromDate, toDate },
        });
        return res.data || [];
    },
};
