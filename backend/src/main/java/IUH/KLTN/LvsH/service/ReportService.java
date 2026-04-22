package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.dto.*;

import java.time.LocalDate;
import java.util.List;

public interface ReportService {
    List<CurrentInventoryReportDTO> getCurrentInventory(Long warehouseId);

    List<LowStockAlertReportDTO> getLowStockAlerts(Long warehouseId, Integer threshold);

    List<StockMovementPeriodReportDTO> getStockMovementByPeriod(Long warehouseId, LocalDate fromDate, LocalDate toDate);

    List<StockAdjustmentSummaryReportDTO> getStockAdjustmentSummary(Long warehouseId, LocalDate fromDate, LocalDate toDate);

    List<DailyRevenueProfitReportDTO> getDailyRevenueProfit(Long warehouseId, LocalDate fromDate, LocalDate toDate);

    List<TopSellingProductReportDTO> getTopSellingProducts(Long warehouseId, LocalDate fromDate, LocalDate toDate, Integer topN);

    // Chức năng thống kê mới
    List<InventoryValueReportDTO> getInventoryValue(Long warehouseId);

    List<DaysOfCoverageReportDTO> getDaysOfCoverage(Long warehouseId, Integer analysisDays);

    List<StockoutRiskReportDTO> getStockoutRisk(Long warehouseId, Integer analysisDays);

    List<SlowMovingProductReportDTO> getSlowMovingProducts(Long warehouseId, Integer inactiveDays);

    List<CurrentInventoryWarehouseReportDTO> getCurrentInventoryDetail(Long warehouseId);

    List<InventoryTurnoverReportDTO> getInventoryTurnover(Long warehouseId, LocalDate fromDate, LocalDate toDate);
}
