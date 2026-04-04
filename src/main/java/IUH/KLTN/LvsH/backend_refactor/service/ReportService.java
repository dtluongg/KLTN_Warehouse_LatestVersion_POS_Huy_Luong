package IUH.KLTN.LvsH.backend_refactor.service;

import IUH.KLTN.LvsH.backend_refactor.dto.CurrentInventoryReportDTO;
import IUH.KLTN.LvsH.backend_refactor.dto.DailyRevenueProfitReportDTO;
import IUH.KLTN.LvsH.backend_refactor.dto.LowStockAlertReportDTO;
import IUH.KLTN.LvsH.backend_refactor.dto.StockMovementPeriodReportDTO;
import IUH.KLTN.LvsH.backend_refactor.dto.StockAdjustmentSummaryReportDTO;
import IUH.KLTN.LvsH.backend_refactor.dto.TopSellingProductReportDTO;

import java.time.LocalDate;
import java.util.List;

public interface ReportService {
    List<CurrentInventoryReportDTO> getCurrentInventory(Long warehouseId);

    List<LowStockAlertReportDTO> getLowStockAlerts(Long warehouseId, Integer threshold);

    List<StockMovementPeriodReportDTO> getStockMovementByPeriod(Long warehouseId, LocalDate fromDate, LocalDate toDate);

    List<StockAdjustmentSummaryReportDTO> getStockAdjustmentSummary(Long warehouseId, LocalDate fromDate, LocalDate toDate);

    List<DailyRevenueProfitReportDTO> getDailyRevenueProfit(Long warehouseId, LocalDate fromDate, LocalDate toDate);

    List<TopSellingProductReportDTO> getTopSellingProducts(Long warehouseId, LocalDate fromDate, LocalDate toDate, Integer topN);
}
